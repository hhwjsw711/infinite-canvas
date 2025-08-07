import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // this the Clerk ID, stored in the subject JWT field
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
  canvases: defineTable({
    userId: v.id("users"),
    title: v.string(),
    stateJson: v.object({
      images: v.array(
        v.object({
          id: v.string(),
          src: v.string(),
          x: v.number(),
          y: v.number(),
          width: v.number(),
          height: v.number(),
          rotation: v.number(),
          isGenerated: v.optional(v.boolean()),
          parentGroupId: v.optional(v.string()),
          cropX: v.optional(v.number()),
          cropY: v.optional(v.number()),
          cropWidth: v.optional(v.number()),
          cropHeight: v.optional(v.number()),
          storageId: v.optional(v.id("_storage")),
        }),
      ),
      videos: v.array(
        v.object({
          id: v.string(),
          src: v.string(),
          x: v.number(),
          y: v.number(),
          width: v.number(),
          height: v.number(),
          rotation: v.number(),
          parentGroupId: v.optional(v.string()),
          cropX: v.optional(v.number()),
          cropY: v.optional(v.number()),
          cropWidth: v.optional(v.number()),
          cropHeight: v.optional(v.number()),
          storageId: v.optional(v.id("_storage")),
          isVideo: v.literal(true),
          duration: v.number(),
          currentTime: v.number(),
          isPlaying: v.boolean(),
          volume: v.number(),
          muted: v.boolean(),
          isLooping: v.optional(v.boolean()),
          isGenerating: v.optional(v.boolean()),
          isLoaded: v.optional(v.boolean()),
        }),
      ),
      viewport: v.object({
        x: v.number(),
        y: v.number(),
        scale: v.number(),
      }),
      version: v.string(),
    }),
    thumbnailUrl: v.optional(v.string()),
    isPublic: v.boolean(),
    updatedAt: v.number(),
    lastAccessedAt: v.number(),
  }),
});
