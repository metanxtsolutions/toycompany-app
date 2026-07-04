"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

/**
 * Cosmetic urgency timer counting down to local midnight. Deals are simply
 * products with a compareAtPrice markdown — there is no scheduled deal
 * system behind this; the clock resets daily by design.
 */
export function FlashDealCountdown() {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(23, 59, 59, 999);
      const ms = midnight.getTime() - now.getTime();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setRemaining(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Render a stable placeholder until mounted to avoid SSR/CSR mismatch.
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-lime/15 px-3 py-1 font-mono text-sm font-bold text-brand-lime tabular-nums">
      <Timer className="size-4" />
      {remaining ?? "--:--:--"}
    </span>
  );
}
