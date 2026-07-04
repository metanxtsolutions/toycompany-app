"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const StorefrontPortalContext = createContext<HTMLDivElement | null>(null);

/**
 * Base UI's Dialog/Sheet portal their content to document.body by default,
 * which sits outside the `.dark`-scoped wrapper below — without this,
 * portaled content (cart drawer, quick view) would render in light theme.
 */
export function useStorefrontPortalContainer() {
  return useContext(StorefrontPortalContext);
}

export function ThemeScope({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setContainer(rootRef.current);
  }, []);

  return (
    <div
      ref={rootRef}
      className="dark flex min-h-screen flex-col bg-background text-foreground"
    >
      <StorefrontPortalContext.Provider value={container}>
        {children}
      </StorefrontPortalContext.Provider>
    </div>
  );
}
