"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPhoneOtp, verifyPhoneOtp } from "@/server/actions/auth";

export function VerifyPhoneForm({ phone }: { phone: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    setIsSending(true);
    const result = await sendPhoneOtp(phone);
    setIsSending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setSent(true);
    toast.success(`Code sent to ${phone} via WhatsApp`);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    const result = await verifyPhoneOtp({ phone, code });
    setIsVerifying(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success("Mobile number verified");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        We&apos;ll send a 6-digit code to <span className="font-medium">{phone}</span> via
        WhatsApp.
      </p>

      {!sent ? (
        <Button className="w-full" onClick={handleSend} disabled={isSending}>
          {isSending ? "Sending…" : "Send code"}
        </Button>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-code">Verification code</Label>
            <Input
              id="otp-code"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? "Verifying…" : "Verify"}
          </Button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Resend code
          </button>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="font-medium text-primary">
          Skip for now
        </Link>
      </p>
    </div>
  );
}
