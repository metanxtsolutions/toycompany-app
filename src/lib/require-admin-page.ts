import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireAdminPermission(
  check: (role: string | undefined) => boolean,
  redirectTo = "/admin/orders",
) {
  const session = await auth();
  if (!check(session?.user?.role)) {
    redirect(redirectTo);
  }
  return session;
}
