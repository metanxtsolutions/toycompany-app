"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * Client-side session check (not a server auth() call) so this doesn't
 * force the static homepage/PDP dynamic — same pattern as WishlistButton.
 */
export function AccountLink() {
  const { data: session, status } = useSession();

  if (!session?.user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Account"
        className="hidden sm:inline-flex"
        disabled={status === "loading"}
        nativeButton={false}
        render={<Link href="/login" />}
      >
        <User className="size-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Your account"
            className="hidden sm:inline-flex"
          />
        }
      >
        <User className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href="/account/orders" />}>My Account</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/orders" />}>Orders</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/wishlist" />}>Wishlist</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} variant="destructive">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
