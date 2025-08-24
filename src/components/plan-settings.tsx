"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlanSettingsProps {
  creditsUsed: number;
  storageUsed: number;
  creditsLimit?: number;
  storageLimit?: number;
}

export function PlanSettings({
  creditsUsed = 0,
  storageUsed = 0,
  creditsLimit = 1000,
  storageLimit = 1000,
}: PlanSettingsProps) {
  const maxCredits = creditsLimit;
  const maxStorage = storageLimit;

  const getPercentage = (value: number, max: number) =>
    Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-card/95 backdrop-blur-xl rounded-3xl border shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)] dark:shadow-none dark:outline dark:outline-1 dark:outline-border">
        <CardHeader>
          <CardTitle className="text-sm font-normal">Credits</CardTitle>
          <CardDescription>
            {creditsUsed.toLocaleString()}/{maxCredits.toLocaleString()} Credits
            Used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={getPercentage(creditsUsed, maxCredits)}
            className="h-2 rounded-full"
          />
        </CardContent>
      </Card>

      <Card className="bg-card/95 backdrop-blur-xl rounded-3xl border shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)] dark:shadow-none dark:outline dark:outline-1 dark:outline-border">
        <CardHeader>
          <CardTitle className="text-sm font-normal">Storage</CardTitle>
          <CardDescription>
            {storageUsed.toLocaleString()}/{maxStorage.toLocaleString()} Storage
            Used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={getPercentage(storageUsed, maxStorage)}
            className="h-2 rounded-full"
          />
        </CardContent>
      </Card>
    </div>
  );
}
