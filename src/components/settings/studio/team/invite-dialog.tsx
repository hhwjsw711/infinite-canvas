"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Plus, X } from "lucide-react";

interface InviteMemberDialogProps {
  organizationId: Id<"organizations">;
  children?: React.ReactNode;
}

interface EmailInvitation {
  email: string;
  role: "member" | "owner";
}

export function InviteMemberDialog({
  organizationId,
  children,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [invitations, setInvitations] = useState<EmailInvitation[]>([
    { email: "", role: "member" },
  ]);
  const { toast } = useToast();

  const createInvitation = useMutation(api.organizations.createInvitation);

  const addInvitation = () => {
    setInvitations((prev) => [...prev, { email: "", role: "member" }]);
  };

  const removeInvitation = (index: number) => {
    setInvitations((prev) => {
      const newList = prev.filter((_, i) => i !== index);
      // Always ensure at least one empty invitation exists
      return newList.length === 0 ? [{ email: "", role: "member" }] : newList;
    });
  };

  const updateInvitation = (
    index: number,
    field: keyof EmailInvitation,
    value: string,
  ) => {
    setInvitations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty emails
    const validInvitations = invitations.filter((inv) => inv.email.trim());

    if (validInvitations.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one email address",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validInvitations.filter(
      (inv) => !emailRegex.test(inv.email.trim()),
    );

    if (invalidEmails.length > 0) {
      toast({
        title: "Error",
        description: `Invalid email addresses: ${invalidEmails.map((inv) => inv.email).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsInviting(true);

      // Send invitations sequentially
      const results = [];
      for (const invitation of validInvitations) {
        try {
          await createInvitation({
            organizationId,
            email: invitation.email.trim().toLowerCase(),
            role: invitation.role,
          });
          results.push({ email: invitation.email, success: true });
        } catch (error) {
          results.push({
            email: invitation.email,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Show results
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      if (successful.length > 0) {
        toast({
          title: "Success",
          description:
            successful.length === 1
              ? `Invitation sent to ${successful[0].email}`
              : `Invitations sent to ${successful.length} recipients`,
        });
      }

      if (failed.length > 0) {
        toast({
          title: "Partial Success",
          description: `Failed to send ${failed.length} invitation(s): ${failed.map((f) => f.email).join(", ")}`,
          variant: "destructive",
        });
      }

      // Reset form only if at least one invitation was successful
      if (successful.length > 0) {
        setInvitations([{ email: "", role: "member" }]);
        setOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitations",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setInvitations([{ email: "", role: "member" }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
          <DialogDescription>
            Add team members with personalized roles. Each person can have a
            different permission level.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-3">
            <Label>Team Member Invitations</Label>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {invitations.map((invitation, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      value={invitation.email}
                      onChange={(e) =>
                        updateInvitation(index, "email", e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="w-28">
                    <Select
                      value={invitation.role}
                      onValueChange={(value: "member" | "owner") =>
                        updateInvitation(index, "role", value)
                      }
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInvitation(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addInvitation}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Person
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                isInviting || !invitations.some((inv) => inv.email.trim())
              }
            >
              {isInviting ? "Sending..." : "Send Invitations"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
