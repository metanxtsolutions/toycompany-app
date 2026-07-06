import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { formatPriceINR } from "@/lib/product-format";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const SPEND_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

function verificationLabel(emailVerified: Date | null, phoneVerified: Date | null) {
  if (emailVerified && phoneVerified) return "Fully Verified";
  if (emailVerified) return "Email Verified";
  if (phoneVerified) return "Phone Verified";
  return "Unverified";
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;

  const [customers, spendByUser] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.order.groupBy({
      by: ["userId"],
      _sum: { total: true },
      where: { userId: { not: null }, status: { in: [...SPEND_STATUSES] } },
    }),
  ]);

  const spendMap = new Map(spendByUser.map((row) => [row.userId as string, row._sum.total ?? 0]));

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Customers</h1>

      <form className="mt-4 max-w-sm">
        <Input name="q" placeholder="Search name or email…" defaultValue={q} />
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Customer ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Mobile</th>
              <th className="p-3 font-medium">Verification</th>
              <th className="p-3 font-medium">Orders</th>
              <th className="p-3 font-medium">Total Spend</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium">Last Login</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs text-muted-foreground" title={customer.id}>
                  {customer.id.slice(0, 8)}
                </td>
                <td className="p-3">
                  <Link href={`/admin/customers/${customer.id}`} className="font-medium text-primary hover:underline">
                    {customer.name ?? "—"}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{customer.email}</td>
                <td className="p-3 text-muted-foreground">{customer.phone ?? "—"}</td>
                <td className="p-3">
                  <Badge variant="secondary">
                    {verificationLabel(customer.emailVerified, customer.phoneVerified)}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">{customer._count.orders}</td>
                <td className="p-3 text-muted-foreground">
                  {formatPriceINR(spendMap.get(customer.id) ?? 0)}
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(customer.createdAt)}
                </td>
                <td className="p-3 text-muted-foreground">
                  {customer.lastLoginAt
                    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(customer.lastLoginAt)
                    : "Never"}
                </td>
                <td className="p-3">
                  <Badge variant={customer.isBlocked ? "destructive" : "default"}>
                    {customer.isBlocked ? "Blocked" : "Active"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
