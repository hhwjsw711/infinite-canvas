import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/icons/logo";

interface LoadingAnimationProps {
  isLoading: boolean;
  loadingMessage?: string;
}

export function LoadingAnimation({
  isLoading,
  loadingMessage,
}: LoadingAnimationProps) {
  return (
    <div className="my-24 flex flex-col">
      <LogoIcon
        className={cn(
          "mb-6 h-80 object-cover text-primary transition-all",
          "data-[loading=true]:animate-logo-spin",
        )}
        data-loading={isLoading}
      />
      <p className="text-center font-light italic">
        {isLoading ? loadingMessage : "Waiting for your input..."}
      </p>
    </div>
  );
}
