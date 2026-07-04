export const ROBOTS_TXT_KEY = "robots_txt";

export const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /checkout
Disallow: /cart
Disallow: /api

Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://toycompany.store"}/sitemap.xml
`;
