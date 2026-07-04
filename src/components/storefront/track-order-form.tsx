"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TrackOrderForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      `/orders/${encodeURIComponent(orderNumber.trim())}?email=${encodeURIComponent(email.trim())}`,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="order-number">Order number</Label>
        <Input
          id="order-number"
          required
          placeholder="TC-XXXXXXX"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="track-email">Email used at checkout</Label>
        <Input
          id="track-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full">
        Track order
      </Button>
    </form>
  );
}
