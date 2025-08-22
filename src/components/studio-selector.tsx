"use client";

// Business Logic Assumptions:
// - User registration automatically creates an organization
// - Organization creation automatically creates a canvas
// - Therefore, every user has at least one organization and every organization has at least one canvas
// - These optimizations remove unnecessary null checks and edge cases based on these guarantees

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateStudioModal } from "../hooks/use-create-studio-modal";
import { useCreateCanvasModal } from "../hooks/use-create-canvas-modal";
import { Check, Plus, Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvex } from "convex/react";

export function StudioSelector() {
  const params = useParams();
  const router = useRouter();
  const convex = useConvex();

  const { setOpen: setCreateStudioModalOpen } = useCreateStudioModal();
  const { setOpen: setCreateCanvasModalOpen } = useCreateCanvasModal();
  const organizations = useQuery(api.organizations.listMine, {});

  const [open, setOpen] = useState(false);

  const organizationId = params.organizationId;
  const roomId = params.roomId;

  const canvases = useQuery(
    api.canvases.getCanvasesByOrganization,
    organizations
      ? {
          organizationId:
            organizationId && typeof organizationId === "string"
              ? (organizationId as Id<"organizations">)
              : organizations[0]._id,
          limit: 10,
        }
      : "skip",
  );

  // Loading state with skeleton for trigger
  if (
    organizations === undefined ||
    (organizations.length > 0 && canvases === undefined)
  ) {
    return (
      <div className="flex items-center gap-3 font-medium">
        <Skeleton className="h-4 w-16" />
        <span className="hidden md:inline">&</span>
        <Skeleton className="h-4 w-20 hidden md:block" />
      </div>
    );
  }

  const currentStudio =
    organizations?.find((org) => String(org._id) === organizationId) ||
    organizations?.[0] ||
    null;

  const currentCanvas =
    canvases?.find(
      (canvas: Doc<"canvases">) => String(canvas._id) === roomId,
    ) || null;

  const handleSetActiveStudio = async (organizationId: string) => {
    if (!organizationId) return;

    // If it's the current studio, close the popover
    if (currentStudio && String(currentStudio._id) === organizationId) {
      setOpen(false);
      return;
    }

    // Switch organization and navigate to its first canvas
    const targetOrg = organizations?.find(
      (org) => String(org._id) === organizationId,
    );
    if (targetOrg) {
      try {
        // Query the first canvas of the target organization (guaranteed to exist by business logic)
        const firstCanvas = await convex.query(
          api.canvases.getFirstCanvasByOrganization,
          {
            organizationId: targetOrg._id,
          },
        );

        if (firstCanvas) {
          router.push(`/${organizationId}/${firstCanvas._id}`);
        } else {
          // This should not happen according to business logic, but fallback for safety
          router.push("/explore");
        }
      } catch (error) {
        console.error("Failed to fetch first canvas for organization:", error);
        router.push("/explore");
      }
    } else {
      router.push("/explore");
    }
    setOpen(false);
  };

  const handleSetActiveCanvas = async (canvasId: string) => {
    if (!organizationId || !canvasId) return;
    router.push(`/${organizationId}/${canvasId}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-3 font-medium cursor-pointer hover:underline">
          <div className="flex items-center gap-2">
            <span className="md:hidden">{currentStudio?.name}</span>
            <div className="hidden md:flex items-center gap-2">
              <span>{currentStudio?.name}</span>
            </div>
          </div>
          <span className="hidden md:inline">&</span>
          <span className="hidden md:inline">
            {currentCanvas?.title || "Untitled"}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={[
          "w-screen md:w-[800px] p-0 overflow-hidden",
          "rounded-3xl border bg-card/95 backdrop-blur-xl",
          "shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)]",
          "dark:shadow-none dark:outline dark:outline-1 dark:outline-border",
        ].join(" ")}
        sideOffset={10}
        align="end"
      >
        <div className="flex divide-x divide-border h-[400px]">
          {/* Studios Column */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Studios</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {organizations.map((org) => {
                const isCurrentOrg =
                  organizationId && String(org._id) === String(organizationId);
                return (
                  <div
                    key={org._id}
                    className="group flex w-full items-center justify-between p-3 hover:bg-muted/40 cursor-pointer border-b border-border/30 last:border-b-0 transition-all duration-200"
                    onClick={() => handleSetActiveStudio(String(org._id))}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {org.name?.charAt(0).toUpperCase() || "S"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{org.name}</span>
                        {org.plan && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {org.plan} plan
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Settings
                        className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity duration-100 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          router.push(`/${String(org._id)}/settings?tab=team`);
                        }}
                      />
                      {isCurrentOrg && (
                        <Check className="h-4 w-4 text-primary group-hover:opacity-75" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border">
              <div
                className="group flex w-full items-center justify-between p-3 hover:bg-muted/40 cursor-pointer transition-all duration-200"
                onClick={() => {
                  setCreateStudioModalOpen(true);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Create new studio</span>
                </div>
                <div className="flex items-center gap-2" />
              </div>
            </div>
          </div>

          {/* Canvases Column */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Canvases</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {canvases === undefined ? (
                // Skeleton loading state for canvases
                <div className="space-y-0">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border-b border-border/30 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="w-4 h-4" />
                    </div>
                  ))}
                </div>
              ) : canvases.length > 0 ? (
                canvases.map((canvas: Doc<"canvases">) => {
                  const isCurrentCanvas = String(canvas._id) === roomId;
                  return (
                    <div
                      key={canvas._id}
                      className="group flex w-full items-center justify-between p-3 hover:bg-muted/40 cursor-pointer border-b border-border/30 last:border-b-0 transition-all duration-200"
                      onClick={() => handleSetActiveCanvas(String(canvas._id))}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {(canvas.title || "Untitled")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate">
                            {canvas.title || "Untitled"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {canvas._creationTime
                              ? `Created ${new Date(canvas._creationTime).toLocaleDateString()}`
                              : "Canvas"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Settings
                          className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity duration-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            // TODO: Add canvas settings route when implemented
                          }}
                        />
                        {isCurrentCanvas && (
                          <Check className="h-4 w-4 text-primary group-hover:opacity-75" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                // This state should not occur as every organization is guaranteed to have at least one canvas
                // But keeping as fallback for edge cases
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    No canvases yet
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Create your first canvas to get started
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-border">
              <div
                className="group flex w-full items-center justify-between p-3 hover:bg-muted/40 cursor-pointer transition-all duration-200"
                onClick={() => {
                  setCreateCanvasModalOpen(true);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Create new canvas</span>
                </div>
                <div className="flex items-center gap-2" />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
