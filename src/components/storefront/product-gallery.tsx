"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GalleryImage {
  url: string;
  altText: string | null;
}

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {active ? (
          <Image
            src={active.url}
            alt={active.altText ?? productName}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover transition-transform duration-300 hover:scale-110"
          />
        ) : null}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border-2",
                index === activeIndex ? "border-primary" : "border-transparent",
              )}
            >
              <Image
                src={image.url}
                alt={image.altText ?? productName}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
