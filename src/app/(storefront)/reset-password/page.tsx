import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/storefront/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Choose a new password</CardTitle>
        </CardHeader>
        <CardContent>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-destructive">
              This reset link is missing its token. Please request a new one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
