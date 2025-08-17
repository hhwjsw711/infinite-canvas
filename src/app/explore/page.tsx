"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons";
import { Clock, Plus, Trash2, Globe, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "../../../convex/_generated/api";
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
  useConvexAuth,
} from "convex/react";
import { Doc, Id } from "../../../convex/_generated/dataModel";

export default function HomePage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [canvasName, setCanvasName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const {
    results: canvases,
    status,
    loadMore,
    isLoading,
  } = usePaginatedQuery(
    api.canvases.getRecentCanvases,
    {},
    { initialNumItems: 12 },
  );

  const { isAuthenticated } = useConvexAuth();

  const user = useQuery(
    api.users.getMyUser,
    !isAuthenticated ? "skip" : undefined,
  );

  const createCanvas = useAction(api.canvases.createCanvasAction);
  const deleteCanvas = useMutation(api.canvases.deleteCanvas);

  const handleCreateCanvas = async () => {
    setIsCreating(true);
    try {
      const canvasId = await createCanvas({
        title: canvasName.trim() || "Untitled Canvas",
        isPublic,
        state: {
          images: [],
          videos: [],
          viewport: { x: 0, y: 0, scale: 1 },
          version: "1.0.0",
        },
      });

      // Close dialog and navigate to new canvas
      setIsDialogOpen(false);
      router.push(`/k/${canvasId}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    canvasId: Id<"canvases">,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      confirm(
        "Are you sure you want to delete this canvas? This action cannot be undone.",
      )
    ) {
      setDeletingId(canvasId);
      await deleteCanvas({ canvasId: canvasId });
      setDeletingId(null);
    }
  };

  return (
    <div
      className="bg-background text-foreground font-focal relative flex flex-col w-full overflow-hidden h-screen"
      style={{ height: "100dvh" }}
    >
      {/* Fixed background */}
      <div className="fixed inset-0 bg-background" />

      {/* Fixed Header with Logo and Search */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="h-16 flex items-center justify-center">
          <Logo className="h-7 w-auto" />
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 relative flex items-center justify-center w-full">
        <div className="relative w-full h-full">
          {/* Gradient Overlays matching root page */}
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10"
            aria-hidden="true"
          />

          {/* Scrollable content with grid */}
          <div className="h-full overflow-y-auto scrollbar-hide pt-20 pb-24 relative">
            {/* Dotted grid background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
                backgroundPosition: "0 0, 16px 16px",
                opacity: 0.08,
              }}
            />

            {isLoading ? (
              <div className="h-full flex items-center justify-center relative z-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !canvases || canvases.length === 0 ? (
              <div className="h-full flex items-center justify-center relative z-10">
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground text-lg">
                    No canvases yet
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Create your first canvas to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full px-4 sm:px-6 lg:px-8 pt-8 pb-4 relative z-10">
                <div className="mx-auto max-w-7xl">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {canvases.map((canvas: Doc<"canvases">) => (
                      <Link key={canvas._id} href={`/k/${canvas._id}`}>
                        <div className="group relative aspect-square flex flex-col rounded-xl border border-border hover:border-primary hover:bg-muted/30 transition-all duration-200 cursor-pointer overflow-hidden hover:shadow-lg">
                          {/* Delete button */}
                          {user?.isAdmin && (
                            <button
                              onClick={(e) => handleDelete(e, canvas._id)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-background/90 backdrop-blur-sm rounded-lg hover:bg-destructive hover:text-destructive-foreground z-10 shadow-sm"
                              disabled={deletingId === canvas._id}
                            >
                              {deletingId === canvas._id ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          )}

                          {/* Public/Private indicator */}
                          <div
                            className="absolute top-2 left-2 p-1.5 bg-background/90 backdrop-blur-sm rounded-lg shadow-sm"
                            title={
                              canvas.isPublic
                                ? "Public canvas"
                                : "Private canvas"
                            }
                          >
                            {canvas.isPublic ? (
                              <Globe className="h-3 w-3 text-green-600" />
                            ) : (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>

                          {/* Main content */}
                          <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
                            <div className="text-center space-y-2 flex-1 flex flex-col justify-center">
                              <h3 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                {canvas.title}
                              </h3>
                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {formatDistanceToNow(
                                    new Date(canvas.updatedAt),
                                    {
                                      addSuffix: true,
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Load More button */}
                  {status === "CanLoadMore" && (
                    <div className="flex justify-center mt-8 pb-4">
                      <Button
                        onClick={() => loadMore(12)}
                        variant="ghost"
                        className="px-8 py-2 bg-background/50 backdrop-blur-sm hover:bg-muted/50"
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed Create button at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20 py-4 bg-gradient-to-t from-background via-background/80 to-transparent">
        <div className="max-w-sm mx-auto px-4">
          <Button
            variant="primary"
            onClick={() => setIsDialogOpen(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Canvas
          </Button>
        </div>
      </div>

      {/* Hide scrollbar and fade-in animation */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Create Canvas Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setCanvasName("");
            setIsPublic(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Canvas</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Canvas name input */}
            <div className="space-y-2">
              <Label htmlFor="canvasname">Canvas name</Label>
              <Input
                id="canvasname"
                value={canvasName}
                onChange={(e) => setCanvasName(e.target.value)}
                placeholder="Enter canvas name"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    handleCreateCanvas();
                  }
                }}
                autoFocus
                maxLength={100}
              />
            </div>

            {/* Public/Private toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="public">Make canvas public</Label>
                <p className="text-xs text-muted-foreground">
                  Public canvases can be discovered by others
                </p>
              </div>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* Create button */}
            <Button
              variant="primary"
              className="w-full"
              onClick={handleCreateCanvas}
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="inline-flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </span>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
