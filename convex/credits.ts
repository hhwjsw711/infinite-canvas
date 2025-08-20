import { ConvexError, v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authQuery } from "./util";
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

export const addCredits = internalMutation({
  args: {
    userId: v.string(),
    credits: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("no user found with that user id");
    }

    await ctx.db.patch(user._id, {
      credits: user.credits + args.credits,
    });
  },
});

export const getMyCredits = authQuery({
  args: {},
  handler: async (ctx, args): Promise<number | null> => {
    if (!ctx.user) {
      return null;
    }
    return ctx.user.credits ?? 0;
  },
});

export async function consumeCreditsHelper(
  ctx: MutationCtx,
  userId: Id<"users">,
  amountToUse: number,
) {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError(`User not found with ID: ${userId}`);
  }

  if ((user.credits ?? 0) < amountToUse) {
    throw new ConvexError(
      `Insufficient credits for user ${userId}. Required: ${amountToUse}, Available: ${user.credits ?? 0}`,
    );
  }

  await ctx.db.patch(userId, {
    credits: (user.credits ?? 0) - amountToUse,
  });
}
