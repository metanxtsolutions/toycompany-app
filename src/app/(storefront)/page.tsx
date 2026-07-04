import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURED_CATEGORIES = [
  { slug: "rc-cars", name: "RC Cars", blurb: "Off-road, drift, and race-ready" },
  { slug: "drones", name: "Drones", blurb: "Camera drones & racing quads" },
  { slug: "model-kits", name: "Model Kits", blurb: "Build-it-yourself scale kits" },
  { slug: "collectibles", name: "Collectibles", blurb: "Limited-run figures & gear" },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-secondary/15">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-6 lg:px-8">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            Now trending across India
          </span>
          <h1 className="font-heading max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            Build. Race. Collect.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Toy Company brings the hottest RC cars, drones, model kits, and
            collectibles straight to hobbyists who want more than a toy —
            they want the next obsession.
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/category/rc-cars" />}
            >
              Shop RC Cars
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/category/drones" />}
            >
              Explore Drones
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Shop by category
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_CATEGORIES.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="flex h-40 flex-col justify-end">
                  <h3 className="font-heading text-lg font-semibold">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.blurb}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            The catalog is warming up
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Product listings, search, and checkout are landing in the next
            build phase. Create an account now to be first in line.
          </p>
          <Button
            className="mt-6"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Create an account
          </Button>
        </div>
      </section>
    </div>
  );
}
