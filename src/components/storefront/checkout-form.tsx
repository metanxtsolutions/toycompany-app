"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPriceINR } from "@/lib/product-format";
import { calculateOrderTotals } from "@/lib/orders";
import { createOrder, verifyPayment, markOrderFailed } from "@/server/actions/checkout";
import { applyCoupon } from "@/server/actions/cart";

interface AddressData {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface CheckoutLineItem {
  id: string;
  quantity: number;
  productName: string;
  variantLabel: string;
  price: number;
  image: { url: string; altText: string | null } | null;
}

export function CheckoutForm({
  items,
  subtotal,
  savedAddresses,
  defaultAddressId,
  userEmail,
  initialCouponCode,
}: {
  items: CheckoutLineItem[];
  subtotal: number;
  savedAddresses: AddressData[];
  defaultAddressId: string | null;
  userEmail: string | null;
  initialCouponCode?: string;
}) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddressId ?? (savedAddresses.length > 0 ? savedAddresses[0].id : "new"),
  );
  const [email, setEmail] = useState(userEmail ?? "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [couponCode, setCouponCode] = useState(initialCouponCode ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    minOrderValue: number | null;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const { discount, shipping, total } = calculateOrderTotals(subtotal, appliedCoupon);
  const showNewAddressForm = selectedAddressId === "new";

  async function handleApplyCoupon() {
    setCouponError(null);
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode);
    if (!result.valid) {
      setCouponError(result.error);
      return;
    }
    if (result.minOrderValue && subtotal < result.minOrderValue) {
      setCouponError(`Minimum order value is ${formatPriceINR(result.minOrderValue)}.`);
      return;
    }
    setAppliedCoupon(result);
  }

  async function handlePayNow(e: React.FormEvent) {
    e.preventDefault();
    if (!scriptReady || !window.Razorpay) {
      toast.error("Payment gateway is still loading, please try again in a moment.");
      return;
    }

    setIsSubmitting(true);

    let result: Awaited<ReturnType<typeof createOrder>>;
    try {
      result = await createOrder({
        email,
        addressId: showNewAddressForm ? undefined : selectedAddressId,
        address: showNewAddressForm
          ? {
              fullName,
              phone,
              line1,
              line2: line2 || undefined,
              city,
              state: stateVal,
              postalCode,
              country: "IN",
            }
          : undefined,
        saveAddress: showNewAddressForm ? saveAddress : undefined,
        couponCode: appliedCoupon?.code,
      });
    } catch {
      toast.error("Something went wrong creating your order. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: result.keyId,
      amount: result.amount,
      currency: result.currency,
      name: "Toy Company",
      description: `Order ${result.orderNumber}`,
      order_id: result.providerOrderId,
      prefill: {
        name: result.customerName,
        email: result.customerEmail,
        contact: result.customerPhone,
      },
      theme: { color: "#f2621a" },
      handler: async (response) => {
        const verifyResult = await verifyPayment({
          orderNumber: result.orderNumber,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });

        if (verifyResult.success) {
          router.push(`/orders/${result.orderNumber}`);
        } else {
          toast.error(verifyResult.error ?? "Payment verification failed.");
          setIsSubmitting(false);
        }
      },
      modal: {
        ondismiss: async () => {
          await markOrderFailed(result.orderNumber);
          setIsSubmitting(false);
        },
      },
    });

    rzp.on("payment.failed", async () => {
      await markOrderFailed(result.orderNumber);
      toast.error("Payment failed. Please try again.");
      setIsSubmitting(false);
    });

    rzp.open();
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
        strategy="lazyOnload"
      />
      <form onSubmit={handlePayNow} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="font-heading font-semibold">Shipping details</h2>

              <div className="space-y-2">
                <Label htmlFor="checkout-email">Email</Label>
                <Input
                  id="checkout-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-input p-3 text-sm"
                    >
                      <input
                        type="radio"
                        name="address"
                        className="mt-1"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                      />
                      <span>
                        <span className="font-medium">{addr.fullName}</span>{" "}
                        {addr.isDefault && (
                          <span className="text-xs text-muted-foreground">(Default)</span>
                        )}
                        <br />
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state}{" "}
                        {addr.postalCode}
                        <br />
                        {addr.phone}
                      </span>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-3 rounded-md border border-input p-3 text-sm">
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === "new"}
                      onChange={() => setSelectedAddressId("new")}
                    />
                    Use a new address
                  </label>
                </div>
              )}

              {showNewAddressForm && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="line1">Address line 1</Label>
                    <Input id="line1" required value={line1} onChange={(e) => setLine1(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="line2">Address line 2 (optional)</Label>
                    <Input id="line2" value={line2} onChange={(e) => setLine2(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" required value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal code</Label>
                    <Input
                      id="postalCode"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                  {userEmail !== null && (
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <Checkbox
                        checked={saveAddress}
                        onCheckedChange={(checked) => setSaveAddress(checked === true)}
                      />
                      Save this address to my account
                    </label>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-heading font-semibold">Items</h2>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 text-sm">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image.url}
                          alt={item.image.altText ?? item.productName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-muted-foreground">
                        {item.variantLabel} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatPriceINR(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-heading font-semibold">Order Summary</h2>

            {!appliedCoupon ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={handleApplyCoupon}>
                  Apply
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span>
                  Coupon <strong>{appliedCoupon.code}</strong> applied
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)}>
                  Remove
                </Button>
              </div>
            )}
            {couponError && <p className="text-xs text-destructive">{couponError}</p>}

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPriceINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatPriceINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPriceINR(shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPriceINR(total)}</span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processing…" : `Pay ${formatPriceINR(total)}`}
            </Button>
          </CardContent>
        </Card>
      </form>
    </>
  );
}
