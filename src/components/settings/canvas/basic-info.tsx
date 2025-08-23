import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { InputCard } from "@/components/input-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CanvasBasicInfoProps {
  canvasId: Id<"canvases">;
}

export function CanvasBasicInfo({ canvasId }: CanvasBasicInfoProps) {
  // Get current canvas data
  const canvas = useQuery(api.canvases.getCanvas, { canvasId });

  // Mutations
  const updateCanvas = useMutation(api.canvases.updateCanvas);

  const handleSaveCanvasTitle = async (title: string) => {
    if (!title.trim()) {
      throw new Error("Canvas title cannot be empty");
    }

    await updateCanvas({
      canvasId,
      title: title.trim(),
    });
  };

  if (!canvas) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-16 sm:w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <InputCard
      title="Canvas Name"
      description="The name of your canvas"
      value={canvas.title}
      placeholder="Enter canvas name"
      onSave={handleSaveCanvasTitle}
    />
  );
}
