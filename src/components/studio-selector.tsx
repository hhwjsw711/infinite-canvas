"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreateStudioModal } from "../hooks/use-create-studio-modal";
import { Check, Plus, Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function StudioSelector() {
  const params = useParams();
  const router = useRouter();

  const { setOpen: setCreateStudioModalOpen } = useCreateStudioModal();
  const organizations = useQuery(api.organizations.listMine, {});

  const [open, setOpen] = useState(false);

  if (organizations === undefined) {
    return (
      <button className="hover:underline opacity-50 cursor-wait">studio</button>
    );
  }

  const organizationId = params.organization as string;
  const currentStudio =
    organizations.find((org) => String(org._id) === organizationId) ||
    organizations.at(0) ||
    null;

  const handleSetActiveStudio = async (organizationId: string) => {
    if (!organizationId) return;
    router.push(`/${organizationId}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="hover:underline">
          {currentStudio?.name || "studio"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={[
          "w-screen md:w-[400px] p-0 overflow-hidden",
          "rounded-3xl border bg-card/95 backdrop-blur-xl",
          "shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)]",
          "dark:shadow-none dark:outline dark:outline-1 dark:outline-border",
        ].join(" ")}
        sideOffset={10}
        align="end"
      >
        <div className="flex flex-col max-h-[300px]">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Studios</h3>
          </div>

          {/* Studios list */}
          <div className="flex-1 overflow-y-auto">
            {organizations.map((org) => (
              <div
                key={org._id}
                className="group flex w-full items-center justify-between p-3 hover:bg-muted cursor-pointer border-b border-border/50 last:border-b-0"
                onClick={() => handleSetActiveStudio(String(org._id))}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {org.name?.charAt(0).toUpperCase() || "S"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{org.name}</span>
                    {org.plan && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {org.plan} plan
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Settings
                    className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity duration-100 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      router.push(`/${String(org._id)}/settings?tab=team`);
                    }}
                  />
                  {currentStudio &&
                    String(currentStudio._id) === String(org._id) && (
                      <Check className="h-4 w-4 text-primary group-hover:opacity-75" />
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Create button */}
          <div className="border-t border-border">
            <div
              className="group flex w-full items-center justify-between p-3 hover:bg-muted cursor-pointer"
              onClick={() => {
                setCreateStudioModalOpen(true);
                setOpen(false);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Create new studio</span>
              </div>
              <div className="flex items-center gap-2" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
