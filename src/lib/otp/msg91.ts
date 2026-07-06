import type { OtpProvider, OtpResult } from "@/lib/otp/provider";

const BASE_URL = "https://control.msg91.com/api/v5/otp";

/**
 * MSG91's classic v5 OTP API. WhatsApp delivery is not a per-request
 * parameter here — it's selected by configuring the OTP template
 * (MSG91_TEMPLATE_ID) with WhatsApp as its primary channel in the
 * MSG91 dashboard (Templates → Advanced settings). MSG91 owns OTP
 * generation/expiry/attempt-tracking server-side, so no local state
 * is stored on our side.
 */
export class Msg91OtpProvider implements OtpProvider {
  private getConfig(): { authKey: string; templateId: string } | null {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    if (!authKey || !templateId) return null;
    return { authKey, templateId };
  }

  async sendOtp(phone: string): Promise<OtpResult> {
    const config = this.getConfig();
    if (!config) {
      console.log(`[otp] MSG91 not configured — would send OTP to ${phone}`);
      return { success: false, error: "Phone verification isn't configured yet." };
    }

    const mobile = phone.replace(/^\+/, "");
    const url = `${BASE_URL}?template_id=${encodeURIComponent(config.templateId)}&mobile=${encodeURIComponent(mobile)}&otp_length=6&otp_expiry=10`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        authkey: config.authKey,
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as { type?: string; message?: string };
    if (data.type !== "success") {
      return { success: false, error: data.message ?? "Failed to send OTP." };
    }
    return { success: true };
  }

  async verifyOtp(phone: string, code: string): Promise<OtpResult> {
    const config = this.getConfig();
    if (!config) {
      return { success: false, error: "Phone verification isn't configured yet." };
    }

    const mobile = phone.replace(/^\+/, "");
    const url = `${BASE_URL}/verify?mobile=${encodeURIComponent(mobile)}&otp=${encodeURIComponent(code)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { authkey: config.authKey },
    });

    const data = (await response.json()) as { type?: string; message?: string };
    if (data.type !== "success") {
      return { success: false, error: data.message ?? "Invalid or expired code." };
    }
    return { success: true };
  }
}

export const otpProvider: OtpProvider = new Msg91OtpProvider();
