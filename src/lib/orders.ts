export const SHIPPING_FLAT_FEE = 9900; // ₹99 in paise
export const FREE_SHIPPING_THRESHOLD = 199900; // ₹1,999 in paise

export interface CouponLike {
  type: "PERCENTAGE" | "FIXED";
  value: number;
}

export function calculateShipping(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
}

export function calculateDiscount(coupon: CouponLike | null, subtotal: number) {
  if (!coupon) return 0;
  if (coupon.type === "PERCENTAGE") {
    return Math.round((subtotal * coupon.value) / 100);
  }
  return Math.min(coupon.value, subtotal);
}

export function calculateOrderTotals(subtotal: number, coupon: CouponLike | null) {
  const discount = calculateDiscount(coupon, subtotal);
  const shipping = calculateShipping(subtotal);
  const total = Math.max(0, subtotal - discount) + shipping;
  return { subtotal, discount, shipping, total };
}

export function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TC-${timestamp}${random}`;
}
