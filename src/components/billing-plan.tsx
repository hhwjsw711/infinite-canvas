"use client";

import { UpgradeButton } from "./ui/upgrade-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanSettings } from "./plan-settings";
import { Crown } from "lucide-react";
import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDate } from "@/utils/format";

export function BillingPlan() {
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;

  const planLimits = useQuery(api.organizations.getPlanLimits, {
    organizationId,
  });
  const subscriptionStatus = useQuery(api.organizations.getSubscriptionStatus, {
    organizationId,
  });

  if (!planLimits || !subscriptionStatus) {
    return <BillingPlanSkeleton />;
  }

  const { creditsUsed, storageUsed, creditsLimit, storageLimit } = planLimits;

  if (subscriptionStatus?.isActive) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return (
      <div className="space-y-10">
        <PlanSettings
          creditsUsed={creditsUsed}
          storageUsed={storageUsed}
          creditsLimit={creditsLimit}
          storageLimit={storageLimit}
        />

        <div className="flex flex-col justify-between gap-4 p-6 transition-colors hover:bg-card/98 bg-card/95 backdrop-blur-xl rounded-3xl border shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)] dark:shadow-none dark:outline dark:outline-1 dark:outline-border">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
              <Crown className="size-4 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-foreground">
                Pro Plan
              </h3>
              <p className="text-xs text-muted-foreground">
                Active subscription
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <div className="space-y-2 text-sm text-secondary-foreground/80">
              <p>Unlimited video generation with all premium features</p>
              {subscriptionStatus.isCanceled &&
              subscriptionStatus.canceledAt ? (
                <p className="text-xs text-muted-foreground">
                  Subscription ends:{" "}
                  {formatDate(
                    new Date(subscriptionStatus.canceledAt).toISOString(),
                    "MMM d, yyyy",
                  )}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Next billing:{" "}
                  {formatDate(nextMonth.toISOString(), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </div>

          <Button variant="primary" onClick={() => {}}>
            Manage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PlanSettings
        creditsUsed={creditsUsed}
        storageUsed={storageUsed}
        creditsLimit={creditsLimit}
        storageLimit={storageLimit}
      />

      <div
        className={`flex flex-col justify-between gap-4 p-6 transition-colors hover:bg-card/98 bg-card/95 backdrop-blur-xl rounded-3xl border shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)] dark:shadow-none dark:outline dark:outline-1 dark:outline-border`}
      >
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <Crown className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-foreground">
              Go Pro
            </h3>
            <p className="text-xs text-muted-foreground">
              Unlock unlimited creativity
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3">
          <div className="space-y-2 text-sm text-secondary-foreground/80">
            <p>Generate 25 videos, 60 FPS, all agents, perfect subtitles</p>
          </div>
        </div>
        <UpgradeButton organizationId={organizationId} />
      </div>
    </div>
  );
}

function BillingPlanSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Card
            key={i}
            className="bg-card/95 backdrop-blur-xl rounded-3xl border shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)] dark:shadow-none dark:outline dark:outline-1 dark:outline-border"
          >
            <CardHeader>
              <CardTitle className="text-sm font-normal">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
              <Skeleton className="h-3 w-32 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col justify-between gap-4 p-6 bg-card/95 backdrop-blur-xl rounded-3xl border shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)] dark:shadow-none dark:outline dark:outline-1 dark:outline-border">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex flex-col items-start gap-3">
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
