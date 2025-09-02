import { INVITE_PARAM } from "@/lib/constants";
import { getAuthToken } from "@/lib/auth";
import { api } from "../../../convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [INVITE_PARAM]?: string }>;
}) {
  const resolvedParams = await searchParams;
  const invite = resolvedParams[INVITE_PARAM];

  const queryString = invite !== undefined ? `?${INVITE_PARAM}=${invite}` : "";
  const token = await getAuthToken();
  const teamSlug = await fetchMutation(api.users.store, {}, { token });
  redirect(`/t/${teamSlug}${queryString}`);
}
