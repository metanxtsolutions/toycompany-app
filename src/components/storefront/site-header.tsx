import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { SearchCommand } from "@/components/storefront/search-command";
import { MobileNav } from "@/components/storefront/mobile-nav";

const NAV_LINKS = [
  { href: "/category/rc-cars", label: "RC Cars" },
  { href: "/category/drones", label: "Drones" },
  { href: "/category/model-kits", label: "Model Kits" },
  { href: "/category/collectibles", label: "Collectibles" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 md:gap-6 lg:px-8">
        <MobileNav links={NAV_LINKS} />

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="font-heading text-xl font-bold tracking-tight text-primary">
            Toy Company
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SearchCommand />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Account"
            className="hidden sm:inline-flex"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            <User className="size-5" />
          </Button>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
