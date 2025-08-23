"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreHorizontal, Users, Mail } from "lucide-react";
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
import { InviteMemberDialog } from "./invite-dialog";
import { PendingInvitations } from "./pending-invitations";

interface TeamMembersProps {
  organizationId: Id<"organizations">;
}

export function TeamMembers({ organizationId }: TeamMembersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch members
  const members = useQuery(api.organizations.getMembers, { organizationId });

  // Mutations
  const removeMember = useMutation(api.organizations.removeMember);

  // Member management handlers
  const handleRemoveMember = async (
    memberId: Id<"members">,
    memberName?: string,
  ) => {
    try {
      await removeMember({ organizationId, memberId });
      toast({
        title: "Success",
        description: `${memberName || "Member"} has been removed from the team`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  // Filter members based on search
  const filteredMembers = members?.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.user.name?.toLowerCase().includes(searchLower) ||
      member.user.email.toLowerCase().includes(searchLower)
    );
  });

  if (!members) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Management
          </CardTitle>
          <InviteMemberDialog organizationId={organizationId} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger
              value="invitations"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Pending Invitations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredMembers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchQuery ? "No members found" : "No members yet"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMembers?.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Avatar>
                        <AvatarImage src={member.user.profileImage} />
                        <AvatarFallback>
                          {member.user.name?.charAt(0) ||
                            member.user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {member.user.name || "Unnamed User"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.user.email}
                        </div>
                      </div>
                      <div className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded">
                        {member.role === "owner" ? "Owner" : "Member"}
                      </div>
                      {member.role !== "owner" && (
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive cursor-pointer">
                                  Remove from team
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove team member?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove{" "}
                                {member.user.name || member.user.email} from the
                                team? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleRemoveMember(
                                    member._id,
                                    member.user.name,
                                  )
                                }
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="mt-6">
            <PendingInvitations organizationId={organizationId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
