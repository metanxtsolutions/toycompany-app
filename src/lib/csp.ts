/**
 * Single source of truth for the Content-Security-Policy.
 *
 * Delivered two ways:
 * 1. As an HTTP header via next.config.ts headers() — the standard path.
 * 2. As a <meta http-equiv> tag in the root layout — because the production
 *    host's CDN (Hostinger hcdn) replaces the CSP response header with its
 *    own minimal one, and it cannot rewrite the HTML body. Browsers enforce
 *    the intersection of all delivered policies, so the meta tag restores
 *    our restrictions even when the header is overridden.
 *
 * Meta-delivered CSP ignores frame-ancestors/report-uri/sandbox per spec, so
 * the meta variant strips frame-ancestors — clickjacking protection is still
 * covered by the X-Frame-Options: DENY header, which the CDN passes through.
 */

const isDev = process.env.NODE_ENV === "development";

const DIRECTIVES = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com https://*.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.razorpay.com",
  "frame-src 'self' https://*.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

export const CSP_HEADER_VALUE = [
  ...DIRECTIVES,
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

export const CSP_META_VALUE = [...DIRECTIVES, "upgrade-insecure-requests"].join(
  "; ",
);
