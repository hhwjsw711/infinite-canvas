import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DangerZone } from "@/components/danger-zone";
import { Card, CardContent } from "@/components/ui/card";

interface CanvasDangerZoneProps {
  organizationId: Id<"organizations">;
  canvasId: Id<"canvases">;
}

export function CanvasDangerZone({
  organizationId,
  canvasId,
}: CanvasDangerZoneProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Get all canvases in this organization to check count
  const canvases = useQuery(api.canvases.getCanvasesByOrganization, {
    organizationId,
    limit: 100,
  });

  // Mutations
  const deleteCanvas = useMutation(api.canvases.deleteCanvas);

  const handleDeleteCanvas = async () => {
    if (!canvases || canvases.length <= 1) {
      throw new Error("Cannot delete the last canvas");
    }

    try {
      setIsDeleting(true);

      // Find the canvas to navigate to before deletion
      const remainingCanvas = canvases.find((c) => c._id !== canvasId);
      if (!remainingCanvas) {
        throw new Error("No remaining canvas found");
      }

      // Delete the canvas
      await deleteCanvas({ canvasId });

      // Immediately navigate to the remaining canvas
      router.replace(`/${organizationId}/${remainingCanvas._id}`);
    } catch (error) {
      setIsDeleting(false);
      throw error;
    }
  };

  if (!canvases) {
    return null; // Loading handled by parent
  }

  const canDeleteCanvas = canvases.length > 1;

  if (!canDeleteCanvas) {
    return (
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Cannot delete this canvas
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                This is your only canvas. Create another canvas before you can
                delete this one.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DangerZone
      title="Delete Canvas"
      description="Permanently delete this canvas and all its content"
      buttonText="Delete Canvas"
      onDelete={handleDeleteCanvas}
    />
  );
}
