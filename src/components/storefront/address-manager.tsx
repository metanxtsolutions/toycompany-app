"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/server/actions/addresses";

interface AddressData {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

export function AddressManager({ addresses }: { addresses: AddressData[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openAddDialog() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(address: AddressData) {
    setEditingId(address.id);
    setForm({
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = { ...form, line2: form.line2 || undefined, country: "IN" };
    const result = editingId
      ? await updateAddress(editingId, payload)
      : await createAddress(payload);

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingId ? "Address updated" : "Address added");
    setDialogOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteAddress(id);
    toast.success("Address removed");
    router.refresh();
  }

  async function handleSetDefault(id: string) {
    await setDefaultAddress(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger render={<Button onClick={openAddDialog} />}>
          <Plus className="size-4" />
          Add address
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit address" : "Add address"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="am-fullName">Full name</Label>
              <Input
                id="am-fullName"
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="am-phone">Phone</Label>
              <Input
                id="am-phone"
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="am-line1">Address line 1</Label>
              <Input
                id="am-line1"
                required
                value={form.line1}
                onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="am-line2">Address line 2 (optional)</Label>
              <Input
                id="am-line2"
                value={form.line2}
                onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="am-city">City</Label>
              <Input
                id="am-city"
                required
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="am-state">State</Label>
              <Input
                id="am-state"
                required
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="am-postalCode">Postal code</Label>
              <Input
                id="am-postalCode"
                required
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              />
            </div>
            <Button type="submit" className="sm:col-span-2" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editingId ? "Save changes" : "Add address"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{address.fullName}</p>
                  {address.isDefault && <span className="text-xs text-primary">Default</span>}
                </div>
                <p className="text-muted-foreground">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
                  {address.postalCode}
                </p>
                <p className="text-muted-foreground">{address.phone}</p>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(address)}>
                    Edit
                  </Button>
                  {!address.isDefault && (
                    <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id)}>
                      Set as default
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(address.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
