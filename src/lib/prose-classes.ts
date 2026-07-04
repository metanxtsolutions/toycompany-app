/** Minimal typography styling for rendered blog HTML, applied via Tailwind arbitrary child selectors (no @tailwindcss/typography dependency). */
export const PROSE_CLASSES =
  "text-sm leading-relaxed " +
  "[&_h1]:font-heading [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold " +
  "[&_h2]:font-heading [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold " +
  "[&_h3]:font-heading [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold " +
  "[&_p]:mb-3 " +
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:mb-1 " +
  "[&_a]:text-primary [&_a]:underline " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs " +
  "[&_img]:rounded-md [&_img]:my-3";
