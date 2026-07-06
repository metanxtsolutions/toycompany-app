"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function PhoneVerifyBanner() {
  const { data: session } = useSession();

  if (!session?.user || session.user.phoneVerified) return null;

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
      <span>Verify your mobile number to secure your account.</span>
      <Link href="/register/verify-phone" className="font-medium text-primary hover:underline">
        Verify now
      </Link>
    </div>
  );
}
