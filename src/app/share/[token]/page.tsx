import { notFound } from "next/navigation";
import { Metadata } from "next";
import ShareCanvasClient from "./client";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

interface SharePageProps {
  params: {
    token: string;
  };
}

// Generate metadata for social sharing
export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  try {
    const canvas = await fetchQuery(api.canvases.getByShareToken, {
      shareToken: params.token,
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

export default async function SharePage({ params }: SharePageProps) {
  try {
    const canvas = await fetchQuery(api.canvases.getByShareToken, {
      shareToken: params.token,
    });
    return <ShareCanvasClient roomId={canvas._id} />;
  } catch {
    notFound();
  }
}
