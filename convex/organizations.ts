import { v } from "convex/values";
import { authMutation, authQuery } from "./util";
import { internalMutation, internalQuery } from "./_generated/server";
import { ConvexError } from "convex/values";

export const createDefaultForUser = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) => q.eq("userId", args.userId))
      .first();

    if (membership) {
      const org = await ctx.db.get(membership.organizationId);
      if (org) {
        const existingCanvas = await ctx.db
          .query("canvases")
          .withIndex("by_organizationId", (q) =>
            q.eq("organizationId", membership.organizationId),
          )
          .first();

        if (!existingCanvas) {
          const now = Date.now();
          const canvasId = await ctx.db.insert("canvases", {
            title: "Untitled",
            organizationId: membership.organizationId,
            stateJson: {
              images: [],
              videos: [],
              viewport: { x: 0, y: 0, scale: 1 },
              version: "1.0.0",
            },
            isPublic: false,
            updatedAt: now,
            lastAccessedAt: now,
          });
          return { id: org._id, name: org.name, canvasId };
        }

        return { id: org._id, name: org.name, canvasId: existingCanvas._id };
      }
    }

    const orgId = await ctx.db.insert("organizations", {
      name: args.name ?? "Personal",
      plan: "free",
    });

    await ctx.db.insert("members", {
      userId: args.userId,
      organizationId: orgId,
      role: "owner",
    });

    const now = Date.now();
    const canvasId = await ctx.db.insert("canvases", {
      title: "Untitled",
      organizationId: orgId,
      stateJson: {
        images: [],
        videos: [],
        viewport: { x: 0, y: 0, scale: 1 },
        version: "1.0.0",
      },
      isPublic: false,
      updatedAt: now,
      lastAccessedAt: now,
    });

    const org = await ctx.db.get(orgId);
    return org ? { id: org._id, name: org.name, canvasId } : null;
  },
});

export const create = authMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      plan: "free",
    });

    await ctx.db.insert("members", {
      organizationId: orgId,
      userId: ctx.user._id,
      role: "owner",
    });

    const now = Date.now();
    const canvasId = await ctx.db.insert("canvases", {
      title: "Untitled",
      organizationId: orgId,
      stateJson: {
        images: [],
        videos: [],
        viewport: { x: 0, y: 0, scale: 1 },
        version: "1.0.0",
      },
      isPublic: false,
      updatedAt: now,
      lastAccessedAt: now,
    });

    return { id: orgId, canvasId };
  },
});

export const listMine = authQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];

    const memberships = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id),
      )
      .order("asc")
      .collect();

    const rows = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.organizationId);
        if (!org) return null;
        return { _id: org._id, name: org.name, plan: org.plan };
      }),
    );

    const filteredRows = rows.filter(
      (r): r is NonNullable<typeof r> => r !== null,
    );
    return filteredRows;
  },
});

export const getUserFirstOrganization = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) => q.eq("userId", args.userId))
      .first();

    return membership;
  },
});

// Get organization by ID
export const getById = authQuery({
  args: { organizationId: v.id("organizations") },
  returns: v.union(
    v.object({
      _id: v.id("organizations"),
      name: v.string(),
      email: v.optional(v.string()),
      logo: v.optional(v.string()),
      plan: v.union(v.literal("free"), v.literal("pro")),
      _creationTime: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    if (!ctx.user) {
      return null;
    }

    // Check if user is a member of this organization
    const membership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id).eq("organizationId", args.organizationId),
      )
      .first();

    if (!membership) {
      return null;
    }

    return await ctx.db.get(args.organizationId);
  },
});

// Update organization
export const update = authMutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    logo: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Check if user is owner of this organization
    const membership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id).eq("organizationId", args.organizationId),
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error(
        "Only organization owners can update organization details",
      );
    }

    const updateData: any = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.logo !== undefined) updateData.logo = args.logo;

    await ctx.db.patch(args.organizationId, updateData);
    return null;
  },
});

// Get organization members
export const getMembers = authQuery({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("members"),
      role: v.union(v.literal("owner"), v.literal("member")),
      user: v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.string(),
        profileImage: v.optional(v.string()),
      }),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Check if user is a member of this organization
    const userMembership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id).eq("organizationId", args.organizationId),
      )
      .first();

    if (!userMembership) {
      throw new Error("You are not a member of this organization");
    }

    const members = await ctx.db
      .query("members")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        if (!user) return null;
        return {
          _id: member._id,
          role: member.role,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
          },
          _creationTime: member._creationTime,
        };
      }),
    );

    return membersWithUsers.filter(
      (m): m is NonNullable<typeof m> => m !== null,
    );
  },
});

// Delete organization (only if user has multiple organizations)
export const deleteOrganization = authMutation({
  args: { organizationId: v.id("organizations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Check if user is owner of this organization
    const membership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id).eq("organizationId", args.organizationId),
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only organization owners can delete the organization");
    }

    // Check if user has multiple organizations
    const userOrganizations = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id),
      )
      .collect();

    if (userOrganizations.length <= 1) {
      throw new Error("Cannot delete your only organization");
    }

    // Delete all canvases in this organization
    const canvases = await ctx.db
      .query("canvases")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    for (const canvas of canvases) {
      await ctx.db.delete(canvas._id);
    }

    // Delete all members
    const members = await ctx.db
      .query("members")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete the organization
    await ctx.db.delete(args.organizationId);
    return null;
  },
});

// Remove member from organization
export const removeMember = authMutation({
  args: {
    organizationId: v.id("organizations"),
    memberId: v.id("members"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Check if user is owner of this organization
    const userMembership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id).eq("organizationId", args.organizationId),
      )
      .first();

    if (!userMembership || userMembership.role !== "owner") {
      throw new Error("Only organization owners can remove members");
    }

    // Get the member to remove
    const memberToRemove = await ctx.db.get(args.memberId);
    if (
      !memberToRemove ||
      memberToRemove.organizationId !== args.organizationId
    ) {
      throw new Error("Member not found in this organization");
    }

    // Don't allow owner to remove themselves
    if (memberToRemove.userId === ctx.user._id) {
      throw new Error("You cannot remove yourself from the organization");
    }

    await ctx.db.delete(args.memberId);
    return null;
  },
});

// Create invitation
export const createInvitation = authMutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Check if user is owner of this organization
    const userMembership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id).eq("organizationId", args.organizationId),
      )
      .first();

    if (!userMembership || userMembership.role !== "owner") {
      throw new Error("Only organization owners can invite members");
    }

    // Check if user is already a member
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      const existingMembership = await ctx.db
        .query("members")
        .withIndex("by_userId_OrganizationId", (q) =>
          q
            .eq("userId", existingUser._id)
            .eq("organizationId", args.organizationId),
        )
        .first();

      if (existingMembership) {
        throw new Error("User is already a member of this organization");
      }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("email"), args.email),
          q.eq(q.field("status"), "pending"),
        ),
      )
      .first();

    if (existingInvitation) {
      throw new Error("There is already a pending invitation for this email");
    }

    // Generate invitation token
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert("invitations", {
      organizationId: args.organizationId,
      email: args.email,
      role: args.role,
      inviterUserId: ctx.user._id,
      token,
      expiresAt,
      status: "pending",
    });

    return null;
  },
});

// Get invitations for organization
export const getInvitations = authQuery({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("invitations"),
      email: v.string(),
      role: v.union(v.literal("owner"), v.literal("member")),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
      ),
      inviter: v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.string(),
      }),
      _creationTime: v.number(),
      expiresAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Check if user is a member of this organization
    const userMembership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id).eq("organizationId", args.organizationId),
      )
      .first();

    if (!userMembership) {
      throw new Error("You are not a member of this organization");
    }

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    const invitationsWithInviter = await Promise.all(
      invitations.map(async (invitation) => {
        const inviter = await ctx.db.get(invitation.inviterUserId);
        if (!inviter) return null;
        return {
          _id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          inviter: {
            _id: inviter._id,
            name: inviter.name,
            email: inviter.email,
          },
          _creationTime: invitation._creationTime,
          expiresAt: invitation.expiresAt,
        };
      }),
    );

    return invitationsWithInviter.filter(
      (i): i is NonNullable<typeof i> => i !== null,
    );
  },
});

// Cancel invitation
export const cancelInvitation = authMutation({
  args: {
    organizationId: v.id("organizations"),
    invitationId: v.id("invitations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Check if user is owner of this organization
    const userMembership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id).eq("organizationId", args.organizationId),
      )
      .first();

    if (!userMembership || userMembership.role !== "owner") {
      throw new Error("Only organization owners can cancel invitations");
    }

    // Get the invitation
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.organizationId !== args.organizationId) {
      throw new Error("Invitation not found in this organization");
    }

    await ctx.db.delete(args.invitationId);
    return null;
  },
});

// Accept invitation (public endpoint for accepting via email link)
export const acceptInvitation = authMutation({
  args: { token: v.string() },
  returns: v.object({
    organizationId: v.id("organizations"),
    organizationName: v.string(),
  }),
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Find invitation by token
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invalid invitation token");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been processed");
    }

    if (invitation.expiresAt < Date.now()) {
      throw new Error("Invitation has expired");
    }

    // Check if the user's email matches the invitation
    if (ctx.user.email !== invitation.email) {
      throw new Error("This invitation is for a different email address");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q
          .eq("userId", ctx.user._id)
          .eq("organizationId", invitation.organizationId),
      )
      .first();

    if (existingMembership) {
      throw new Error("You are already a member of this organization");
    }

    // Add user to organization
    await ctx.db.insert("members", {
      userId: ctx.user._id,
      organizationId: invitation.organizationId,
      role: invitation.role,
    });

    // Update invitation status
    await ctx.db.patch(invitation._id, { status: "accepted" });

    // Get organization name for response
    const organization = await ctx.db.get(invitation.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    return {
      organizationId: invitation.organizationId,
      organizationName: organization.name,
    };
  },
});
