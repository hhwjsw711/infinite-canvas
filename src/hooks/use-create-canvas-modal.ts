import { parseAsBoolean, useQueryState } from "nuqs";

export function useCreateCanvasModal() {
  const [open, setOpen] = useQueryState(
    "create-canvas",
    parseAsBoolean.withDefault(false),
  );

  return {
    open,
    setOpen,
  };
}
