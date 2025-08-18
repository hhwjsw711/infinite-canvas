import { parseAsBoolean, useQueryState } from "nuqs";

export function useCreateStudioModal() {
  const [open, setOpen] = useQueryState(
    "create-studio",
    parseAsBoolean.withDefault(false),
  );

  return {
    open,
    setOpen,
  };
}
