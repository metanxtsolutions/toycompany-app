import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddressManager } from "@/components/storefront/address-manager";

export const metadata: Metadata = {
  title: "Your Addresses",
};

export default async function AccountAddressesPage() {
  const session = await auth();
  const addresses = await prisma.address.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return <AddressManager addresses={addresses} />;
}
