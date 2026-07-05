"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Client-side session check (not a server auth() call) so this doesn't
 * force the static homepage/PDP dynamic — same pattern as WishlistButton.
 */
export function AccountLink() {
  const { data: session, status } = useSession();
  const href = session?.user ? "/account/orders" : "/login";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={session?.user ? "Your account" : "Account"}
      className="hidden sm:inline-flex"
      disabled={status === "loading"}
      nativeButton={false}
      render={<Link href={href} />}
    >
      <User className="size-5" />
    </Button>
  );
}
