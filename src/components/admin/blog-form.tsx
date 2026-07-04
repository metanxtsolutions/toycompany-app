"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { markdownToSafeHtml } from "@/lib/markdown";
import { upsertBlogPost } from "@/server/actions/admin/blog";
import { PROSE_CLASSES } from "@/lib/prose-classes";

interface BlogPostInitialData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentMarkdown: string;
  coverImage: string | null;
  categoryTag: string | null;
  publishedAt: Date | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BlogForm({ initialData }: { initialData?: BlogPostInitialData }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initialData);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [contentMarkdown, setContentMarkdown] = useState(initialData?.contentMarkdown ?? "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
  const [categoryTag, setCategoryTag] = useState(initialData?.categoryTag ?? "");
  const [isPublished, setIsPublished] = useState(!!initialData?.publishedAt);
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState(initialData?.metaKeywords ?? "");
  const [ogImage, setOgImage] = useState(initialData?.ogImage ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewHtml = useMemo(() => markdownToSafeHtml(contentMarkdown), [contentMarkdown]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await upsertBlogPost(initialData?.id ?? null, {
      title,
      slug,
      excerpt: excerpt || undefined,
      contentMarkdown,
      coverImage: coverImage || undefined,
      categoryTag: categoryTag || undefined,
      isPublished,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      metaKeywords: metaKeywords || undefined,
      ogImage: ogImage || undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(initialData ? "Post updated" : "Post created");
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="post-title">Title</Label>
          <Input id="post-title" required value={title} onChange={(e) => handleTitleChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-slug">Slug</Label>
          <Input
            id="post-slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="post-cover">Cover image URL</Label>
          <Input id="post-cover" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-category">Category tag</Label>
          <Input
            id="post-category"
            value={categoryTag}
            onChange={(e) => setCategoryTag(e.target.value)}
            placeholder="e.g. RC Cars"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="post-excerpt">Excerpt</Label>
        <Textarea
          id="post-excerpt"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="post-content">Content (Markdown)</Label>
          <Textarea
            id="post-content"
            required
            rows={18}
            className="font-mono text-sm"
            value={contentMarkdown}
            onChange={(e) => setContentMarkdown(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Live preview</Label>
          <div
            className={`h-[27.5rem] overflow-y-auto rounded-md border border-input p-4 ${PROSE_CLASSES}`}
            dangerouslySetInnerHTML={{ __html: previewHtml || "<p class='text-muted-foreground'>Nothing to preview yet.</p>" }}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={isPublished} onCheckedChange={(c) => setIsPublished(c === true)} />
        Published (visible on the storefront)
      </label>

      <div className="space-y-4 border-t border-border pt-4">
        <h2 className="font-heading font-semibold">SEO</h2>
        <div className="space-y-2">
          <Label htmlFor="post-metaTitle">Meta title</Label>
          <Input id="post-metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-metaDescription">Meta description</Label>
          <Textarea
            id="post-metaDescription"
            rows={2}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-metaKeywords">Meta keywords (comma-separated)</Label>
          <Input id="post-metaKeywords" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-ogImage">Open Graph image URL</Label>
          <Input id="post-ogImage" value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : initialData ? "Save changes" : "Create post"}
      </Button>
    </form>
  );
}
