import { v } from "convex/values";
import Stripe from "stripe";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const CREDIT_PACK_SIZE = 25;

type Metadata = {
  userId: string;
  creditPacks: string;
};

export const pay = action({
  args: { creditPacks: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("you must be logged in to purchase credits");
    }

    if (!user.emailVerified) {
      throw new Error("you must have a verified email to purchase credits");
    }

    const domain = process.env.HOSTING_URL ?? "http://localhost:3000";
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        { price: process.env.PRICE_ID!, quantity: args.creditPacks },
      ],
      customer_email: user.email,
      metadata: {
        userId: user.subject,
        creditPacks: args.creditPacks,
      },
      mode: "payment",
      payment_method_types: ["card", "wechat_pay", "alipay"],
      payment_method_options: {
        wechat_pay: {
          client: "web",
        },
      },
      success_url: `${domain}`,
      cancel_url: `${domain}`,
    });

    return session.url!;
  },
});

export const pro = action({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("you must be logged in to subscribe");
    }

    if (!user.emailVerified) {
      throw new Error("you must have a verified email to subscribe");
    }

    const domain = process.env.HOSTING_URL ?? "http://localhost:3000";
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
      customer_email: user.email,
      metadata: {
        userId: user.subject,
        organizationId: args.organizationId,
      },
      mode: "subscription",
      success_url: `${domain}`,
      cancel_url: `${domain}`,
    });

    return session.url!;
  },
});

export const fulfill = internalAction({
  args: { signature: v.string(), payload: v.string() },
  handler: async (ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const webhookSecret = process.env.STRIPE_WEBHOOKS_SECRET!;
    try {
      const event = await stripe.webhooks.constructEventAsync(
        args.payload,
        args.signature,
        webhookSecret,
      );

      const completedEvent = event.data.object as Stripe.Checkout.Session & {
        metadata: Metadata;
      };

      if (event.type === "checkout.session.completed") {
        if (
          completedEvent.mode === "payment" &&
          completedEvent.metadata?.creditPacks
        ) {
          const creditPacks = parseInt(completedEvent.metadata.creditPacks);
          const creditsToAdd = creditPacks * CREDIT_PACK_SIZE;

          const userId = completedEvent.metadata
            .userId as unknown as Id<"users">;

          await ctx.runMutation(internal.credits.addCredits, {
            userId,
            credits: creditsToAdd,
          });
        } else if (completedEvent.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(
            completedEvent.subscription as string,
          );

          const organizationId = completedEvent.metadata
            .organizationId as Id<"organizations">;

          await ctx.runMutation(internal.organizations.updateSubscription, {
            organizationId,
            subscriptionId: subscription.id,
            canceledAt: subscription.current_period_end * 1000,
          });
        }
      }

      if (event.type === "invoice.payment_succeeded") {
        const subscription = await stripe.subscriptions.retrieve(
          completedEvent.subscription as string,
        );

        await ctx.runMutation(
          internal.organizations.updateSubscriptionBySubId,
          {
            subscriptionId: subscription.id,
            canceledAt: subscription.current_period_end * 1000,
          },
        );
      }

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: (err as { message: string }).message };
    }
  },
});
