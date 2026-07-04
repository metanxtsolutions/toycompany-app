"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertCategory } from "@/server/actions/admin/categories";

interface CategoryOption {
  id: string;
  name: string;
}

interface CategoryInitialData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
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

export function CategoryForm({
  initialData,
  parentOptions,
}: {
  initialData?: CategoryInitialData;
  parentOptions: CategoryOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initialData);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [image, setImage] = useState(initialData?.image ?? "");
  const [parentId, setParentId] = useState(initialData?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState(String(initialData?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState(initialData?.metaKeywords ?? "");
  const [ogImage, setOgImage] = useState(initialData?.ogImage ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await upsertCategory(initialData?.id ?? null, {
      name,
      slug,
      description: description || undefined,
      image: image || undefined,
      parentId: parentId || undefined,
      sortOrder: Number(sortOrder) || 0,
      isActive,
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
    toast.success(initialData ? "Category updated" : "Category created");
    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cat-name">Name</Label>
          <Input id="cat-name" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-slug">Slug</Label>
          <Input
            id="cat-slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-description">Description</Label>
        <Textarea
          id="cat-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Parent category</Label>
          <Select
            items={{
              none: "None (top-level)",
              ...Object.fromEntries(
                parentOptions
                  .filter((opt) => opt.id !== initialData?.id)
                  .map((opt) => [opt.id, opt.name]),
              ),
            }}
            value={parentId || "none"}
            onValueChange={(v) => setParentId(!v || v === "none" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top-level)</SelectItem>
              {parentOptions
                .filter((opt) => opt.id !== initialData?.id)
                .map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-sort">Sort order</Label>
          <Input
            id="cat-sort"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-image">Image URL</Label>
        <Input id="cat-image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
        Active (visible on the storefront)
      </label>

      <div className="space-y-4 border-t border-border pt-4">
        <h2 className="font-heading font-semibold">SEO</h2>
        <div className="space-y-2">
          <Label htmlFor="cat-metaTitle">Meta title</Label>
          <Input id="cat-metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-metaDescription">Meta description</Label>
          <Textarea
            id="cat-metaDescription"
            rows={2}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-metaKeywords">Meta keywords (comma-separated)</Label>
          <Input
            id="cat-metaKeywords"
            value={metaKeywords}
            onChange={(e) => setMetaKeywords(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-ogImage">Open Graph image URL</Label>
          <Input id="cat-ogImage" value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : initialData ? "Save changes" : "Create category"}
      </Button>
    </form>
  );
}
