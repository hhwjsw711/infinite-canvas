import { parseAsBoolean, useQueryState } from "nuqs";

export function useBuyCreditsModal() {
  const [open, setOpen] = useQueryState(
    "buy-credits",
    parseAsBoolean.withDefault(false),
  );

  return {
    open,
    setOpen,
  };
}
