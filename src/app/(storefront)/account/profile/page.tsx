import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/storefront/profile-form";

export const metadata: Metadata = {
  title: "Profile Settings",
};

export default async function AccountProfilePage() {
  const session = await auth();

  return (
    <ProfileForm
      initialName={session!.user.name ?? ""}
      email={session!.user.email ?? ""}
    />
  );
}
