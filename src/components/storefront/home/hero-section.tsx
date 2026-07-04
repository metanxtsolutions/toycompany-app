import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroBanner {
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

export function HeroSection({ banner }: { banner: HeroBanner | null }) {
  const title = banner?.title ?? "Build. Race. Collect.";
  const subtitle = banner?.subtitle ?? "New Drop";
  const href = banner?.linkUrl ?? "/category/rc-cars";

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        {banner?.imageUrl ? (
          <Image
            src={banner.imageUrl}
            alt="Featured collection of RC cars, drones, and collectibles"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          {subtitle}
        </span>
        <h1 className="max-w-3xl text-5xl leading-[1.05] font-bold tracking-tight sm:text-7xl">
          {title}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          The hottest RC cars, drones, model kits, and collectibles — picked
          for hobbyists who want more than a toy. They want the next obsession.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            className="h-12 px-6 text-base"
            nativeButton={false}
            render={<Link href={href} />}
          >
            Shop the Drop <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-6 text-base"
            nativeButton={false}
            render={<Link href="/category/drones" />}
          >
            Explore Drones
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span>✓ Free shipping over ₹1,999</span>
          <span>✓ Secure payments</span>
          <span>✓ Loved by 1,000+ hobbyists</span>
        </div>
      </div>
    </section>
  );
}
