import { auth } from "@clerk/nextjs/server";

export async function getAuthToken() {
  const { getToken } = await auth();
  return (await getToken({ template: "convex" })) ?? undefined;
}
