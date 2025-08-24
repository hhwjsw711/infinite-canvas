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
import { useCreateStudioModal } from "@/hooks/use-create-studio-modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SubmitButton } from "@/components/ui/submit-button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Building2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Studio name is required"),
});

export function CreateStudioModal() {
  const { open, setOpen } = useCreateStudioModal();
  const router = useRouter();
  const [error, setError] = useState<string>("");

  const createOrganization = useMutation(api.organizations.create);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setError("");
    }
  }, [open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError("");

    try {
      const org = await createOrganization({ name: values.name.trim() });

      if (org?.id && org?.canvasId) {
        // Success: use SPA routing with fallback
        form.reset();
        setOpen(false);

        const newPath = `/${org.id}/${org.canvasId}`;
        router.push(newPath);

        // Fallback for edge cases
        setTimeout(() => {
          if (window.location.pathname !== newPath) {
            window.location.replace(newPath);
          }
        }, 100);
      } else {
        setError("Failed to create studio. Please try again.");
      }
    } catch (error) {
      setError("Failed to create studio. Please try again.");
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
            <div className="grid size-9 place-items-center rounded-xl bg-blue-500/15 text-blue-600">
              <Building2 className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Create Studio</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Create a workspace to organize your canvases and collaborate
                with others
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Studio Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. My Creative Studio"
                        {...field}
                        className="rounded-xl"
                        autoFocus
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
                  Create studio
                </SubmitButton>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
