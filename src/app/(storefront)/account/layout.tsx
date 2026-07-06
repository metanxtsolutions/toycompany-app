import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PhoneVerifyBanner } from "@/components/storefront/phone-verify-banner";
import { AccountNav } from "@/components/storefront/account-nav";

const NAV_LINKS = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/security", label: "Security" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/account/orders");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold tracking-tight">My Account</h1>
      <PhoneVerifyBanner />
      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_1fr]">
        <AccountNav links={NAV_LINKS} />
        <div>{children}</div>
      </div>
    </div>
  );
}
