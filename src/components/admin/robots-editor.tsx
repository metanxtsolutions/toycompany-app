"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateRobotsTxt } from "@/server/actions/admin/settings";

export function RobotsEditor({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    const result = await updateRobotsTxt(value);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("robots.txt updated");
  }

  return (
    <div className="max-w-2xl space-y-3">
      <Textarea
        rows={14}
        className="font-mono text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button onClick={handleSave} disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save robots.txt"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Live at{" "}
        <a href="/robots.txt" target="_blank" className="underline">
          /robots.txt
        </a>
      </p>
    </div>
  );
}
