"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Clock, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface PendingInvitationsProps {
  organizationId: Id<"organizations">;
}

// Utility functions
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function formatExpiresIn(expiresAt: number): string {
  const now = Date.now();
  const diff = expiresAt - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (diff < 0) return "Expired";
  if (days > 0) return `Expires in ${days}d`;
  if (hours > 0) return `Expires in ${hours}h`;
  return "Expires soon";
}

export function PendingInvitations({
  organizationId,
}: PendingInvitationsProps) {
  const { toast } = useToast();

  // Fetch invitations
  const invitations = useQuery(api.organizations.getInvitations, {
    organizationId,
  });

  // Cancel invitation mutation
  const cancelInvitation = useMutation(api.organizations.cancelInvitation);

  const handleCancelInvitation = async (
    invitationId: Id<"invitations">,
    email: string,
  ) => {
    try {
      await cancelInvitation({ organizationId, invitationId });
      toast({
        title: "Success",
        description: `Invitation to ${email} has been cancelled`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  // Filter only pending invitations
  const pendingInvitations =
    invitations?.filter((inv) => inv.status === "pending") || [];

  if (!invitations) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (pendingInvitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingInvitations.map((invitation) => (
        <div
          key={invitation._id}
          className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50"
        >
          <div className="flex-1">
            <div className="font-medium text-sm">{invitation.email}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>
                Invited by {invitation.inviter.name || invitation.inviter.email}
              </span>
              <span>•</span>
              <span>{formatTimeAgo(invitation._creationTime)}</span>
            </div>
          </div>
          <div className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded">
            {invitation.role === "owner" ? "Owner" : "Member"}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatExpiresIn(invitation.expiresAt)}
          </div>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive cursor-pointer">
                    Cancel invitation
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel the invitation to{" "}
                  {invitation.email}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    handleCancelInvitation(invitation._id, invitation.email)
                  }
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Cancel Invitation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
