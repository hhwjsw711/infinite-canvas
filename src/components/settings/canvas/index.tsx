import { useParams } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { CanvasBasicInfo } from "./basic-info";
import { CanvasDangerZone } from "./danger-zone";

export function CanvasSettings() {
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;
  const roomId = params.roomId as Id<"canvases">;

  return (
    <div className="space-y-6 max-w-2xl">
      <CanvasBasicInfo canvasId={roomId} />
      <CanvasDangerZone organizationId={organizationId} canvasId={roomId} />
    </div>
  );
}
