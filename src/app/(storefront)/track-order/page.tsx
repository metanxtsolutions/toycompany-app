import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackOrderForm } from "@/components/storefront/track-order-form";

export const metadata: Metadata = {
  title: "Track Your Order",
};

export default function TrackOrderPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Track your order</CardTitle>
        </CardHeader>
        <CardContent>
          <TrackOrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
