"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertProduct } from "@/server/actions/admin/products";

interface CategoryOption {
  id: string;
  name: string;
}

interface ImageRow {
  url: string;
  altText: string;
}

interface AttributeRow {
  key: string;
  value: string;
}

interface VariantRow {
  id?: string;
  sku: string;
  attributes: AttributeRow[];
  priceOverride: string;
  stockQuantity: string;
  lowStockThreshold: string;
  isActive: boolean;
}

interface ProductInitialData {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string | null;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  basePrice: number;
  compareAtPrice: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  images: { url: string; altText: string | null }[];
  variants: {
    id: string;
    sku: string;
    attributes: unknown;
    priceOverride: number | null;
    stockQuantity: number;
    lowStockThreshold: number;
    isActive: boolean;
  }[];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyVariant(): VariantRow {
  return {
    sku: "",
    attributes: [{ key: "", value: "" }],
    priceOverride: "",
    stockQuantity: "0",
    lowStockThreshold: "5",
    isActive: true,
  };
}

export function ProductForm({
  initialData,
  categories,
}: {
  initialData?: ProductInitialData;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initialData);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [brand, setBrand] = useState(initialData?.brand ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? categories[0]?.id ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");
  const [basePrice, setBasePrice] = useState(
    initialData ? String(initialData.basePrice / 100) : "",
  );
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialData?.compareAtPrice ? String(initialData.compareAtPrice / 100) : "",
  );
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");
  const [ogImage, setOgImage] = useState(initialData?.ogImage ?? "");
  const [images, setImages] = useState<ImageRow[]>(
    initialData?.images.length
      ? initialData.images.map((img) => ({ url: img.url, altText: img.altText ?? "" }))
      : [{ url: "", altText: "" }],
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    initialData?.variants.length
      ? initialData.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          attributes: Object.entries(v.attributes as Record<string, string>).map(([key, value]) => ({
            key,
            value,
          })),
          priceOverride: v.priceOverride ? String(v.priceOverride / 100) : "",
          stockQuantity: String(v.stockQuantity),
          lowStockThreshold: String(v.lowStockThreshold),
          isActive: v.isActive,
        }))
      : [emptyVariant()],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function updateImage(index: number, field: keyof ImageRow, value: string) {
    setImages((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string | boolean) {
    setVariants((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function updateAttribute(variantIndex: number, attrIndex: number, field: keyof AttributeRow, value: string) {
    setVariants((rows) =>
      rows.map((row, i) => {
        if (i !== variantIndex) return row;
        return {
          ...row,
          attributes: row.attributes.map((attr, j) =>
            j === attrIndex ? { ...attr, [field]: value } : attr,
          ),
        };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await upsertProduct(initialData?.id ?? null, {
      name,
      slug,
      description,
      brand: brand || undefined,
      categoryId,
      status,
      basePrice: Number(basePrice),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      ogImage: ogImage || undefined,
      images: images
        .filter((img) => img.url.trim())
        .map((img) => ({ url: img.url.trim(), altText: img.altText || undefined })),
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku.trim(),
        attributes: Object.fromEntries(
          v.attributes.filter((a) => a.key.trim()).map((a) => [a.key.trim(), a.value.trim()]),
        ),
        priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
        stockQuantity: Number(v.stockQuantity) || 0,
        lowStockThreshold: Number(v.lowStockThreshold) || 0,
        isActive: v.isActive,
      })),
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(initialData ? "Product updated" : "Product created");
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-name">Name</Label>
          <Input id="p-name" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-slug">Slug</Label>
          <Input
            id="p-slug"
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
        <Label htmlFor="p-description">Description</Label>
        <Textarea
          id="p-description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="p-brand">Brand</Label>
          <Input id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
            value={categoryId}
            onValueChange={(v) => v && setCategoryId(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            items={{ DRAFT: "Draft", ACTIVE: "Active", ARCHIVED: "Archived" }}
            value={status}
            onValueChange={(v) => v && setStatus(v as typeof status)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-basePrice">Base price (₹)</Label>
          <Input
            id="p-basePrice"
            type="number"
            required
            min="0"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-compareAtPrice">Compare-at price (₹, optional)</Label>
          <Input
            id="p-compareAtPrice"
            type="number"
            min="0"
            step="0.01"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold">Images</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setImages((rows) => [...rows, { url: "", altText: "" }])}
          >
            <Plus className="size-4" /> Add image
          </Button>
        </div>
        {images.map((image, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Image URL"
              value={image.url}
              onChange={(e) => updateImage(index, "url", e.target.value)}
            />
            <Input
              placeholder="Alt text"
              value={image.altText}
              onChange={(e) => updateImage(index, "altText", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setImages((rows) => rows.filter((_, i) => i !== index))}
              disabled={images.length <= 1}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold">Variants</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVariants((rows) => [...rows, emptyVariant()])}
          >
            <Plus className="size-4" /> Add variant
          </Button>
        </div>
        {variants.map((variant, vIndex) => (
          <Card key={vIndex}>
            <CardContent className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1 sm:col-span-2">
                  <Label>SKU</Label>
                  <Input
                    required
                    value={variant.sku}
                    onChange={(e) => updateVariant(vIndex, "sku", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Price override (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.priceOverride}
                    onChange={(e) => updateVariant(vIndex, "priceOverride", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Stock qty</Label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={variant.stockQuantity}
                    onChange={(e) => updateVariant(vIndex, "stockQuantity", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Low-stock threshold</Label>
                  <Input
                    type="number"
                    min="0"
                    value={variant.lowStockThreshold}
                    onChange={(e) => updateVariant(vIndex, "lowStockThreshold", e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <Checkbox
                    checked={variant.isActive}
                    onCheckedChange={(c) => updateVariant(vIndex, "isActive", c === true)}
                  />
                  Active
                </label>
                <div className="sm:col-span-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVariants((rows) => rows.filter((_, i) => i !== vIndex))}
                    disabled={variants.length <= 1}
                  >
                    Remove variant
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attributes (e.g. color, scale)</Label>
                {variant.attributes.map((attr, aIndex) => (
                  <div key={aIndex} className="flex gap-2">
                    <Input
                      placeholder="Key (e.g. color)"
                      value={attr.key}
                      onChange={(e) => updateAttribute(vIndex, aIndex, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Value (e.g. Red)"
                      value={attr.value}
                      onChange={(e) => updateAttribute(vIndex, aIndex, "value", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setVariants((rows) =>
                          rows.map((row, i) =>
                            i === vIndex
                              ? { ...row, attributes: row.attributes.filter((_, j) => j !== aIndex) }
                              : row,
                          ),
                        )
                      }
                      disabled={variant.attributes.length <= 1}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setVariants((rows) =>
                      rows.map((row, i) =>
                        i === vIndex
                          ? { ...row, attributes: [...row.attributes, { key: "", value: "" }] }
                          : row,
                      ),
                    )
                  }
                >
                  <Plus className="size-4" /> Add attribute
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <h2 className="font-heading font-semibold">SEO</h2>
        <div className="space-y-2">
          <Label htmlFor="p-metaTitle">Meta title</Label>
          <Input id="p-metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-metaDescription">Meta description</Label>
          <Textarea
            id="p-metaDescription"
            rows={2}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-ogImage">Open Graph image URL</Label>
          <Input id="p-ogImage" value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : initialData ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}
