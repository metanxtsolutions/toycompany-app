import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { ThemeScope } from "@/components/storefront/theme-scope";
import { PromoStrip } from "@/components/storefront/home/promo-strip";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeScope>
      <PromoStrip />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </ThemeScope>
  );
}
