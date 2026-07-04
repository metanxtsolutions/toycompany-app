"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Link href="/" className="font-heading text-xl font-bold tracking-tight text-primary">
        Toy Company
      </Link>
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Something stalled out
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          An unexpected error occurred. You can try again, or head back to the
          homepage.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
