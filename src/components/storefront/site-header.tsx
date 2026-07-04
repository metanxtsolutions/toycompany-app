import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/category/rc-cars", label: "RC Cars" },
  { href: "/category/drones", label: "Drones" },
  { href: "/category/model-kits", label: "Model Kits" },
  { href: "/category/collectibles", label: "Collectibles" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-heading text-xl font-bold tracking-tight text-primary">
            Toy Company
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
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
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Account"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            <User className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cart"
            nativeButton={false}
            render={<Link href="/cart" />}
          >
            <ShoppingCart className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
