import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = [
  {
    heading: "Shop",
    links: [
      { href: "/category/rc-cars", label: "RC Cars" },
      { href: "/category/drones", label: "Drones" },
      { href: "/category/model-kits", label: "Model Kits" },
      { href: "/category/collectibles", label: "Collectibles" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/account/orders", label: "Track Order" },
      { href: "/contact", label: "Contact Us" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Toy Company" },
      { href: "/blog", label: "Blog" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <span className="font-heading text-lg font-bold text-primary">
              Toy Company
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              Trending RC cars, drones, model kits, and collectibles for
              hobbyists who love to build, race, and collect.
            </p>
            <form className="mt-4 flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="max-w-56"
                aria-label="Email for newsletter"
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="text-sm font-semibold">{group.heading}</h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Toy Company. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
