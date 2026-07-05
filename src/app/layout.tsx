import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CSP_META_VALUE } from "@/lib/csp";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toycompany.store";

const defaultTitle = "Toy Company | RC Cars, Drones & Collectibles";
const defaultDescription =
  "Toy Company brings trending RC cars, RC bikes, drones, model kits, and collectibles to hobbyists across India.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | Toy Company",
  },
  description: defaultDescription,
  openGraph: {
    siteName: "Toy Company",
    title: defaultTitle,
    description: defaultDescription,
    url: siteUrl,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* React hoists this into <head>. Backstop for hosts whose CDN
            overrides the CSP response header (see src/lib/csp.ts). */}
        <meta httpEquiv="Content-Security-Policy" content={CSP_META_VALUE} />
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
