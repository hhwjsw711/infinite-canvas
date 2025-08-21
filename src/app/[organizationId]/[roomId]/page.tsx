"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader } from "lucide-react";

// Dynamically import the canvas to avoid SSR issues
const Canvas = dynamic(() => import("@/components/canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <Loader className="h-8 w-8 animate-spin" />
    </div>
  ),
});

export default function RoomPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const roomId = params.roomId as string;

  return <Canvas organizationId={organizationId} roomId={roomId} />;
}
