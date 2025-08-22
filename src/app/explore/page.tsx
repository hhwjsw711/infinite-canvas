"use client";

import React, { useState } from "react";
import { Logo } from "@/components/icons";
import { Clock, Trash2, Globe, Lock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { IndexedDBMigration } from "@/components/migration/IndexedDBMigration";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Get all public canvases
  const publicCanvasesResult = useQuery(api.canvases.getPublicCanvases, {
    paginationOpts: { numItems: 12, cursor: null },
  });
  const canvases = publicCanvasesResult?.page || [];
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(
    api.users.getMyUser,
    !isAuthenticated ? "skip" : undefined,
  );
  const deleteCanvas = useMutation(api.canvases.deleteCanvas);

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

      {/* Fixed Header with Logo and Title */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="h-16 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Logo className="h-7 w-auto" />
          </div>
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

            {publicCanvasesResult === undefined ? (
              // Skeleton loading state
              <div className="w-full px-4 sm:px-6 lg:px-8 pt-8 pb-4 relative z-10">
                <div className="mx-auto max-w-7xl">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="relative aspect-square flex flex-col rounded-xl border border-border overflow-hidden"
                      >
                        {/* Skeleton indicators */}
                        <div className="absolute top-2 left-2 z-10">
                          <Skeleton className="w-6 h-6 rounded-lg" />
                        </div>

                        {/* Main content skeleton */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
                          <Skeleton className="h-4 w-3/4" />
                          <div className="flex items-center gap-1">
                            <Skeleton className="w-3 h-3 rounded-full" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : canvases.length === 0 ? (
              <div className="h-full flex items-center justify-center relative z-10">
                <div className="text-center space-y-4 max-w-md mx-auto px-4">
                  <div className="size-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                    <Globe className="size-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-lg font-medium">
                      No public canvases yet
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      No canvases have been made public yet. Be the first to
                      share your creative work!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full px-4 sm:px-6 lg:px-8 pt-8 pb-4 relative z-10">
                <div className="mx-auto max-w-7xl">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {canvases.map((canvas: Doc<"canvases">) => (
                      <Link
                        key={canvas._id}
                        href={`/${canvas.organizationId}/${canvas._id}`}
                      >
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
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Migration section */}
      <div className="fixed bottom-20 left-0 right-0 z-20 py-4">
        <div className="max-w-sm mx-auto px-4">
          <IndexedDBMigration />
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
    </div>
  );
}
