import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface ShowcaseCategory {
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

export function CategoryShowcase({ categories }: { categories: ShowcaseCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-bold tracking-widest text-secondary uppercase">
        Find your lane
      </p>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Shop by Category
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="group relative block h-56 overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-all duration-300 hover:ring-primary/50"
          >
            {category.image ? (
              <Image
                src={category.image}
                alt={`${category.name} collection`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="font-heading text-lg font-bold text-white">
                {category.name}
              </h3>
              {category.description ? (
                <p className="line-clamp-1 text-xs text-white/70">
                  {category.description}
                </p>
              ) : null}
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-lime opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Shop now <ArrowRight className="size-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
