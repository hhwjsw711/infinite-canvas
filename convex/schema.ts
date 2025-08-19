import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(), // this the Clerk ID, stored in the subject JWT field
    email: v.string(),
    credits: v.optional(v.number()),
    name: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    profileImage: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
  organizations: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    logo: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro")),
  }),
  members: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    role: v.union(v.literal("owner"), v.literal("member")),
  }).index("by_userId_OrganizationId", ["userId", "organizationId"]),
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
          cloudImageId: v.optional(v.string()), // Reference to cloud storage
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
          cloudVideoId: v.optional(v.string()), // Reference to cloud storage
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
  }).index("by_updatedAt", ["updatedAt"]),
  files: defineTable({
    canvasId: v.string(),
    key: v.string(),
    url: v.string(),
  }),
});
