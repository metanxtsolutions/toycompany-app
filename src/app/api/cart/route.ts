import { NextResponse } from "next/server";
import { getCart, cartTotals } from "@/lib/cart";

export async function GET() {
  const cart = await getCart();
  const totals = cartTotals(cart);

  return NextResponse.json({
    items: cart?.items ?? [],
    ...totals,
  });
}
