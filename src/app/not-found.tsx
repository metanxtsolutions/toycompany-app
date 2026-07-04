import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Link href="/" className="font-heading text-xl font-bold tracking-tight text-primary">
        Toy Company
      </Link>
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Looks like this one raced off the track
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          We couldn&apos;t find the page you were looking for. It may have been
          moved, sold out, or never existed.
        </p>
      </div>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to home
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/category/rc-cars" />}
        >
          Shop RC Cars
        </Button>
      </div>
    </div>
  );
}
