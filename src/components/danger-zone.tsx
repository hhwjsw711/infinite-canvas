"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DangerZoneProps {
  onDelete?: () => Promise<void> | void;
  title?: string;
  description?: string;
  buttonText?: string;
}

export function DangerZone({
  onDelete,
  title = "Delete",
  description = "This action cannot be undone",
  buttonText = "Delete",
}: DangerZoneProps) {
  const [deleteText, setDeleteText] = useState("");
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (deleteText === "DELETE") {
      try {
        setIsDeleting(true);
        await onDelete?.();
        toast({
          title: "Success",
          description: "Deleted successfully",
        });
        setOpen(false);
        setDeleteText(""); // Reset state
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to delete",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setDeleteText(""); // Reset when closing
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-red-600 dark:text-red-400">
              {title}
            </CardTitle>
            <p className="text-sm text-content-light mt-1">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              {buttonText}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className="mb-4">
              <DialogTitle className="mb-2">
                {"Are you absolutely sure?"}
              </DialogTitle>
              <DialogDescription>
                {"This action cannot be undone. Please type DELETE to confirm."}
              </DialogDescription>
            </DialogHeader>

            <Input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder={"Type DELETE to confirm"}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleDelete}
                disabled={deleteText !== "DELETE" || isDeleting}
                className="bg-red-600 text-white hover:bg-red-700 border-red-600 disabled:bg-red-300 disabled:border-red-300"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
