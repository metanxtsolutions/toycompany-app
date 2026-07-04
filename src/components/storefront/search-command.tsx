"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { formatPriceINR } from "@/lib/product-format";

interface SuggestResult {
  products: { id: string; name: string; slug: string; basePrice: number }[];
  categories: { id: string; name: string; slug: string }[];
}

export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SuggestResult>({ products: [], categories: [] });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setResults({ products: [], categories: [] });
        return;
      }
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function goTo(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleSubmitSearch() {
    if (query.trim()) goTo(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search className="size-5" />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Toy Company"
        description="Search for products and categories"
      >
        <CommandInput
          placeholder="Search RC cars, drones, collectibles…"
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmitSearch();
          }}
        />
        <CommandList>
          {query.trim() && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {results.categories.length > 0 && (
            <CommandGroup heading="Categories">
              {results.categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`category-${category.name}`}
                  onSelect={() => goTo(`/category/${category.slug}`)}
                >
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.products.length > 0 && (
            <CommandGroup heading="Products">
              {results.products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`product-${product.name}`}
                  onSelect={() => goTo(`/products/${product.slug}`)}
                >
                  <span className="flex-1">{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatPriceINR(product.basePrice)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
