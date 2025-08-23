"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { toast } = useToast();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationId, setOrganizationId] =
    useState<Id<"organizations"> | null>(null);

  const acceptInvitation = useMutation(api.organizations.acceptInvitation);

  // Query first canvas when we have organizationId
  const firstCanvas = useQuery(
    api.canvases.getFirstCanvasByOrganization,
    organizationId ? { organizationId } : "skip",
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link");
      return;
    }

    handleAcceptInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    try {
      const result = await acceptInvitation({ token });
      setStatus("success");
      setOrganizationName(result.organizationName);
      setOrganizationId(result.organizationId);
      setMessage(`You've successfully joined ${result.organizationName}!`);

      toast({
        title: "Success",
        description: `Welcome to ${result.organizationName}!`,
      });
    } catch (error) {
      setStatus("error");
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Failed to accept invitation");
      }

      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to accept invitation",
        variant: "destructive",
      });
    }
  };

  // Handle redirect when first canvas is loaded
  useEffect(() => {
    if (status === "success" && firstCanvas !== undefined) {
      const redirectPath = firstCanvas
        ? `/${organizationId}/${firstCanvas._id}`
        : "/";

      setTimeout(() => {
        router.push(redirectPath);
      }, 3000);
    }
  }, [status, firstCanvas, organizationId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <Skeleton className="w-16 h-16 rounded-full" />
            )}
            {status === "success" && (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === "error" && (
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-xl">
            {status === "loading" && <Skeleton className="h-7 w-48 mx-auto" />}
            {status === "success" && "Welcome to the Team!"}
            {status === "error" && "Invitation Error"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-64 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          ) : (
            <p className="text-muted-foreground">{message}</p>
          )}

          {status === "loading" && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-56 mx-auto" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {firstCanvas
                  ? `Redirecting to ${organizationName} canvas in 3 seconds...`
                  : `Redirecting to dashboard in 3 seconds...`}
              </p>
              <Button
                onClick={() => {
                  const redirectPath = firstCanvas
                    ? `/${organizationId}/${firstCanvas._id}`
                    : "/";
                  router.push(redirectPath);
                }}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {firstCanvas ? `Go to ${organizationName}` : "Go to Dashboard"}
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/")}
                variant="default"
                className="w-full"
              >
                Return to Home
              </Button>
              <Button onClick={handleAcceptInvitation} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
