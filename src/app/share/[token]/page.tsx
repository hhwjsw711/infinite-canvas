import { notFound } from "next/navigation";
import { Metadata } from "next";
import ShareCanvasClient from "./client";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

// Generate metadata for social sharing
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  try {
    const { token } = await params;
    const canvas = await fetchQuery(api.canvases.getByShareToken, {
      shareToken: token,
    });
    return {
      title: `${canvas.title} - Infinite Kanvas`,
      description: "View this shared canvas on Infinite Kanvas",
      openGraph: {
        title: canvas.title,
        description: "Shared canvas on Infinite Kanvas",
        type: "website",
        images: canvas.thumbnailUrl ? [canvas.thumbnailUrl] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: canvas.title,
        description: "Shared canvas on Infinite Kanvas",
        images: canvas.thumbnailUrl ? [canvas.thumbnailUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Shared Canvas - Infinite Kanvas",
      description: "View shared canvas",
    };
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  try {
    const { token } = await params;
    const canvas = await fetchQuery(api.canvases.getByShareToken, {
      shareToken: token,
    });
    return <ShareCanvasClient roomId={String(canvas._id)} />;
  } catch {
    notFound();
  }
}
