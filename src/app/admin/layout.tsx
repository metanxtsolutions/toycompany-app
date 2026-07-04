import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

const STAFF_ROLES = new Set(["SUPPORT", "MANAGER", "SUPER_ADMIN"]);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;

  if (!role || !STAFF_ROLES.has(role)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/30 p-4">
        <Link href="/admin" className="font-heading text-lg font-bold text-primary">
          Toy Company Admin
        </Link>
        <nav className="mt-6 flex flex-col gap-1 text-sm">
          <Link href="/admin/products" className="rounded-md px-2 py-1.5 hover:bg-accent">
            Products
          </Link>
          <Link href="/admin/orders" className="rounded-md px-2 py-1.5 hover:bg-accent">
            Orders
          </Link>
          <Link href="/admin/customers" className="rounded-md px-2 py-1.5 hover:bg-accent">
            Customers
          </Link>
          <Link href="/admin/coupons" className="rounded-md px-2 py-1.5 hover:bg-accent">
            Coupons
          </Link>
          <Link href="/admin/banners" className="rounded-md px-2 py-1.5 hover:bg-accent">
            Banners
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
