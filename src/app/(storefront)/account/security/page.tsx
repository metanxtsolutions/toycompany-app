import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/storefront/change-password-form";

export const metadata: Metadata = {
  title: "Security Settings",
};

export default async function AccountSecurityPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return (
      <p className="text-sm text-muted-foreground">
        This account signs in with Google, so there&apos;s no password to change here.
      </p>
    );
  }

  return <ChangePasswordForm />;
}
