import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Crown } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";

interface UpgradeButtonProps {
  organizationId: Id<"organizations">;
}

export function UpgradeButton({ organizationId }: UpgradeButtonProps) {
  const pro = useAction(api.stripe.pro);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgradeClick() {
    try {
      setIsLoading(true);
      setError(null);
      const url = await pro({ organizationId });
      router.push(url);
    } catch (err) {
      console.error("Upgrade error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start upgrade process",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          {error}
        </p>
      )}
      <Button
        variant={"primary"}
        onClick={handleUpgradeClick}
        disabled={isLoading}
        className="rounded-xl w-full"
      >
        {isLoading ? "Processing..." : "GO PRO"} <Crown className="size-4" />
      </Button>
    </div>
  );
}
