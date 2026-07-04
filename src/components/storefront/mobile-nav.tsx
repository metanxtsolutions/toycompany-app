"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useStorefrontPortalContainer } from "@/components/storefront/theme-scope";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const portalContainer = useStorefrontPortalContainer();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="md:hidden"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" container={portalContainer} className="w-72">
        <SheetHeader>
          <SheetTitle className="font-heading text-lg font-bold text-primary">
            Toy Company
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          <Separator className="my-2" />
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <User className="size-4" /> Account
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
