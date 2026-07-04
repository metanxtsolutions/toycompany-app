import { auth } from "@/lib/auth";

export async function getSessionIfAllowed(
  check: (role: string | undefined) => boolean,
) {
  const session = await auth();
  if (!check(session?.user?.role)) return null;
  return session;
}
