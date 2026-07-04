"use server";

import { getProductsByIds, getProductForQuickView } from "@/lib/products";

export async function fetchProductsByIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) return [];
  return getProductsByIds(ids.slice(0, 10));
}

export async function fetchProductQuickView(id: string) {
  if (typeof id !== "string" || !id) return null;
  return getProductForQuickView(id);
}
