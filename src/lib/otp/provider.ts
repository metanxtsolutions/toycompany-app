export interface OtpResult {
  success: boolean;
  error?: string;
}

export interface OtpProvider {
  sendOtp(phone: string): Promise<OtpResult>;
  verifyOtp(phone: string, code: string): Promise<OtpResult>;
}
