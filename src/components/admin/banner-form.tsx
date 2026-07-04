"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertBanner } from "@/server/actions/admin/banners";

interface BannerInitialData {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  placement: "HOME_HERO" | "HOME_STRIP" | "CATEGORY";
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  sortOrder: number;
}

export function BannerForm({ initialData }: { initialData?: BannerInitialData }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(initialData?.linkUrl ?? "");
  const [placement, setPlacement] = useState<"HOME_HERO" | "HOME_STRIP" | "CATEGORY">(
    initialData?.placement ?? "HOME_HERO",
  );
  const [startsAt, setStartsAt] = useState(
    initialData?.startsAt ? initialData.startsAt.toISOString().slice(0, 10) : "",
  );
  const [endsAt, setEndsAt] = useState(
    initialData?.endsAt ? initialData.endsAt.toISOString().slice(0, 10) : "",
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initialData?.sortOrder ?? 0));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await upsertBanner(initialData?.id ?? null, {
      title,
      subtitle: subtitle || undefined,
      imageUrl,
      linkUrl: linkUrl || undefined,
      placement,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      isActive,
      sortOrder: Number(sortOrder) || 0,
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(initialData ? "Banner updated" : "Banner created");
    router.push("/admin/banners");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="banner-title">Title</Label>
        <Input id="banner-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="banner-subtitle">Subtitle (optional)</Label>
        <Input
          id="banner-subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g. New Drop"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="banner-image">Image URL</Label>
        <Input id="banner-image" required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="banner-link">Link URL (optional)</Label>
        <Input id="banner-link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/category/rc-cars" />
      </div>

      <div className="space-y-2">
        <Label>Placement</Label>
        <Select
          items={{ HOME_HERO: "Home hero", HOME_STRIP: "Home strip", CATEGORY: "Category page" }}
          value={placement}
          onValueChange={(v) => v && setPlacement(v as typeof placement)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOME_HERO">Home hero</SelectItem>
            <SelectItem value="HOME_STRIP">Home strip</SelectItem>
            <SelectItem value="CATEGORY">Category page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="banner-starts">Starts on (optional)</Label>
          <Input id="banner-starts" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="banner-ends">Ends on (optional)</Label>
          <Input id="banner-ends" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-sort">Sort order</Label>
        <Input id="banner-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
        Active
      </label>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : initialData ? "Save changes" : "Create banner"}
      </Button>
    </form>
  );
}
