export interface PaymentOrderInput {
  /** Amount in the smallest currency unit (paise for INR). */
  amount: number;
  currency: string;
  receipt: string;
}

export interface PaymentOrderResult {
  providerOrderId: string;
  amount: number;
  currency: string;
  /** Public key safe to expose to the client for the checkout widget. */
  keyId: string;
}

export interface VerifyPaymentInput {
  providerOrderId: string;
  paymentId: string;
  signature: string;
}

export interface RefundResult {
  refundId: string;
}

export interface PaymentProvider {
  createOrder(input: PaymentOrderInput): Promise<PaymentOrderResult>;
  verifySignature(input: VerifyPaymentInput): boolean;
  refund(paymentId: string, amount: number): Promise<RefundResult>;
}
