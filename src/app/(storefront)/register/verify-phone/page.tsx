import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VerifyPhoneForm } from "@/components/storefront/verify-phone-form";

export const metadata: Metadata = {
  title: "Verify Mobile Number",
};

export default async function VerifyPhonePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, phoneVerified: true },
  });

  if (!user?.phone || user.phoneVerified) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Verify your mobile number</CardTitle>
        </CardHeader>
        <CardContent>
          <VerifyPhoneForm phone={user.phone} />
        </CardContent>
      </Card>
    </div>
  );
}
