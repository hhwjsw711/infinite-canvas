import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    // Convex Auth fields
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // custom fields
    username: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  }).index("email", ["email"]),
  files: defineTable({
    name: v.string(),
    size: v.number(),
    type: v.string(),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    uploadState: v.union(
      v.object({
        kind: v.literal("created"),
      }),
      v.object({
        kind: v.literal("uploading"),
        progress: v.number(),
        lastProgressAt: v.number(),
        timeoutJobId: v.id("_scheduled_functions"),
      }),
      v.object({
        kind: v.literal("uploaded"),
        storageId: v.id("_storage"),
        url: v.string(),
      }),
      v.object({
        kind: v.literal("errored"),
        message: v.string(),
      }),
    ),
  }),
});
