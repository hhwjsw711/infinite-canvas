"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Coins, Minus, Plus, Zap, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useBuyCreditsModal } from "@/hooks/use-buy-credits-modal";
import { useConvexAuth, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Progress } from "@/components/ui/progress";

export function BuyCreditsModal() {
  const { open, setOpen } = useBuyCreditsModal();
  const [creditPacks, setCreditPacks] = useState(1);
  const pay = useAction(api.stripe.pay);
  const { isAuthenticated } = useConvexAuth();

  const user = useQuery(
    api.users.getMyUser,
    !isAuthenticated ? "skip" : undefined,
  );

  const UNIT_CREDITS = 25;
  const UNIT_PRICE = 5;
  const MIN_PACKS = 1;
  const MAX_PACKS = 10;

  const totalCredits = creditPacks * UNIT_CREDITS;
  const totalPrice = creditPacks * UNIT_PRICE;

  const credits = user?.credits ?? 0;
  const progressValue = Math.min(100, (credits / 1000) * 100);

  async function handleUpgradeClick() {
    if (!isAuthenticated) return;
    try {
      const url = await pay({ creditPacks });
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      console.error("Failed to create checkout session:", e);
    }
  }

  const levelText =
    progressValue < 25
      ? "Poor 😭"
      : progressValue < 50
        ? "Average 🙂"
        : progressValue < 75
          ? "Good 😏"
          : "Excellent 😎";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={[
          "sm:max-w-[520px] p-0 overflow-hidden",
          "rounded-3xl border bg-card/95 backdrop-blur-xl",
          "shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)]",
          "dark:shadow-none dark:outline dark:outline-1 dark:outline-border",
        ].join(" ")}
      >
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-yellow-500/15 text-yellow-600">
              <Coins className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Purchase Credits</DialogTitle>
              <DialogDescription className="text-xs">
                Each pack contains 25 credits (~2-3 videos)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tabular-nums">{totalCredits}</p>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="icon"
                className="h-9 w-9 rounded-lg"
                disabled={creditPacks <= MIN_PACKS}
                onClick={() =>
                  setCreditPacks((prev) => Math.max(MIN_PACKS, prev - 1))
                }
                aria-label="Decrease"
                title="Decrease"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <span className="w-9 text-center text-lg tabular-nums">
                {creditPacks}
              </span>

              <Button
                variant="default"
                size="icon"
                className="h-9 w-9 rounded-lg"
                disabled={creditPacks >= MAX_PACKS}
                onClick={() =>
                  setCreditPacks((prev) => Math.min(MAX_PACKS, prev + 1))
                }
                aria-label="Increase"
                title="Increase"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-muted-foreground">
                {UNIT_CREDITS} credits / ${UNIT_PRICE} per pack
              </p>
              <p className="text-lg font-semibold tabular-nums">
                Total: ${totalPrice}
              </p>
            </div>

            <Button
              onClick={handleUpgradeClick}
              variant="primary"
              className="w-full h-10 rounded-xl gap-2"
              disabled={!isAuthenticated}
              title={
                isAuthenticated ? "Purchase credits" : "Please sign in first"
              }
            >
              Purchase Credits
              <Zap className="h-4 w-4" />
            </Button>

            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground text-center">
                Please sign in to continue
              </p>
            )}
          </div>

          <div className="h-px bg-border/40" />

          <div className="rounded-xl border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Available Credits</p>
              <p className="text-lg font-bold tabular-nums">
                <span className="text-foreground">{credits}</span>
              </p>
            </div>

            <div className="mt-3">
              <Progress value={progressValue} />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Info className="size-4" />
                <span>10 credits ≈ 1 video • {levelText}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
