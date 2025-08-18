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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SubmitButton } from "../submit-button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Building2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Studio name is required"),
});

export function CreateStudioModal() {
  const { open, setOpen } = useCreateStudioModal();
  const router = useRouter();

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
    }
  }, [open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const org = await createOrganization({ name: values.name.trim() });
      if (org?.id) {
        setOpen(false);
        router.replace(`/`);
        router.refresh();
      }

      form.reset();
    } catch (error) {
      console.error("Failed to create team:", error);
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
                A studio helps you organize canvases and collaborators
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
