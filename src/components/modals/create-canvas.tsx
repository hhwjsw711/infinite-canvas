"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCreateCanvasModal } from "@/hooks/use-create-canvas-modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SubmitButton } from "@/components/ui/submit-button";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { FileImage } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

const formSchema = z.object({
  title: z.string().min(1, "Canvas name is required"),
  isPublic: z.boolean().default(false),
});

export function CreateCanvasModal() {
  const { open, setOpen } = useCreateCanvasModal();
  const params = useParams();
  const organizationId = params.organizationId as string;
  const router = useRouter();
  const [error, setError] = useState<string>("");

  const createCanvas = useAction(api.canvases.createCanvasAction);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      isPublic: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setError("");
    }
  }, [open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!organizationId) {
      setError("Organization not found");
      return;
    }

    setError("");

    try {
      const result = await createCanvas({
        title: values.title.trim(),
        isPublic: values.isPublic,
        organizationId: organizationId as Id<"organizations">,
        state: {
          images: [],
          videos: [],
          viewport: { x: 0, y: 0, scale: 1 },
          version: "1.0.0",
        },
      });

      if (result?.canvasId && result?.organizationId) {
        // Success: use SPA routing with fallback
        form.reset();
        setOpen(false);

        const newPath = `/${result.organizationId}/${result.canvasId}`;
        router.push(newPath);

        // Fallback for edge cases
        setTimeout(() => {
          if (window.location.pathname !== newPath) {
            window.location.replace(newPath);
          }
        }, 100);
      } else {
        setError("Failed to create canvas. Please try again.");
      }
    } catch (error) {
      setError("Failed to create canvas. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={[
          "sm:max-w-[520px] p-0 overflow-hidden",
          "rounded-3xl border bg-card/95 backdrop-blur-xl",
          "shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)]",
          "dark:shadow-none dark:outline dark:outline-1 dark:outline-border",
        ].join(" ")}
      >
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-green-500/15 text-green-600">
              <FileImage className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Create Canvas</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Create a new canvas to start creating and collaborating
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canvas Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. My Creative Canvas"
                        {...field}
                        className="rounded-xl"
                        autoFocus
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Make canvas public
                      </FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        Public canvases can be discovered by others
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  type="button"
                  disabled={form.formState.isSubmitting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <SubmitButton
                  isSubmitting={form.formState.isSubmitting}
                  size="sm"
                  className="rounded-xl"
                  variant="primary"
                >
                  Create canvas
                </SubmitButton>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
