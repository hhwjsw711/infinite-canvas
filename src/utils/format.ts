import { format, isSameYear } from "date-fns";

export function formatDate(
  date: string,
  dateFormat?: string | null,
  checkYear = true,
) {
  if (checkYear && isSameYear(new Date(), new Date(date))) {
    return format(new Date(date), "MMM d");
  }

  return format(new Date(date), dateFormat ?? "P");
}
