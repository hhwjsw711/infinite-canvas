import { mutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

export const r2 = new R2(components.r2);

function getFileTypeFromExtension(fileName: string): "image" | "video" {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));

  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"];

  if (imageExtensions.includes(extension)) return "image";
  if (videoExtensions.includes(extension)) return "video";

  return "image";
}

export const generateUploadUrl = mutation({
  args: {
    canvasId: v.string(),
    fileName: v.string(),
  },
  handler: async (ctx, { canvasId, fileName }) => {
    const fileType = getFileTypeFromExtension(fileName);
    const folder = fileType === "video" ? "videos" : "images";
    const r2Key = `canvases/${canvasId}/${folder}/${fileName}`;
    const { url, key } = await r2.generateUploadUrl(r2Key);

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`;

    return {
      url,
      key,
      fileUrl,
    };
  },
});

export const syncMetadata = action({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    await r2.syncMetadata(ctx, args.key);
  },
});

export const create = mutation({
  args: {
    canvasId: v.string(),
    key: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("files", {
      canvasId: args.canvasId,
      key: args.key,
      url: args.url,
    });

    return id;
  },
});
