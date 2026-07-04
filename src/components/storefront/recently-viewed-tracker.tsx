"use client";

import { useEffect } from "react";

export const RECENTLY_VIEWED_KEY = "recently-viewed";
const MAX_ITEMS = 10;

/** Records a PDP visit in localStorage. Renders nothing. */
export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const next = [productId, ...ids.filter((id) => id !== productId)].slice(
        0,
        MAX_ITEMS,
      );
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable (private mode etc.) — tracking is best-effort
    }
  }, [productId]);

  return null;
}
