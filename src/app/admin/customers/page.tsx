import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;

  const customers = await prisma.user.findMany({
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
  });

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
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Orders</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-border">
                <td className="p-3">
                  <Link href={`/admin/customers/${customer.id}`} className="font-medium text-primary hover:underline">
                    {customer.name ?? "—"}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{customer.email}</td>
                <td className="p-3 text-muted-foreground">{customer._count.orders}</td>
                <td className="p-3 text-muted-foreground">
                  {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(customer.createdAt)}
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
