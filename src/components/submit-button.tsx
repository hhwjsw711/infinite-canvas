import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button";

export function SubmitButton({
  children,
  isSubmitting,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  isSubmitting: boolean;
  disabled?: boolean;
} & ButtonProps) {
  return (
    <Button
      disabled={isSubmitting || disabled}
      {...props}
      className={cn("relative rounded-xl", props.className)}
    >
      <span className={cn({ "opacity-0": isSubmitting })}>{children}</span>

      {isSubmitting && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}
    </Button>
  );
}
