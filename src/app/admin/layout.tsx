import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  isStaff,
  canManageCatalog,
  canManageCoupons,
  canManageBanners,
  canViewAnalytics,
  canManageContent,
} from "@/lib/admin-permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;

  if (!isStaff(role)) {
    redirect("/login");
  }

  const navLinks = [
    { href: "/admin", label: "Dashboard", show: canViewAnalytics(role) },
    { href: "/admin/products", label: "Products", show: canManageCatalog(role) },
    { href: "/admin/categories", label: "Categories", show: canManageCatalog(role) },
    { href: "/admin/inventory", label: "Inventory", show: canManageCatalog(role) },
    { href: "/admin/orders", label: "Orders", show: true },
    { href: "/admin/customers", label: "Customers", show: true },
    { href: "/admin/coupons", label: "Coupons", show: canManageCoupons(role) },
    { href: "/admin/banners", label: "Banners", show: canManageBanners(role) },
    { href: "/admin/reviews", label: "Reviews", show: isStaff(role) },
    { href: "/admin/blog", label: "Blog", show: canManageContent(role) },
    { href: "/admin/settings", label: "Settings", show: canManageContent(role) },
  ].filter((link) => link.show);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/30 p-4 print:hidden">
        <Link href="/admin" className="font-heading text-lg font-bold text-primary">
          Toy Company Admin
        </Link>
        <nav className="mt-6 flex flex-col gap-1 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-1.5 hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 print:p-0">{children}</main>
    </div>
  );
}
