import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import type {
  PaymentProvider,
  PaymentOrderInput,
  PaymentOrderResult,
  VerifyPaymentInput,
  RefundResult,
} from "@/lib/payments/provider";

let razorpayClient: Razorpay | null = null;

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
}

class RazorpayProvider implements PaymentProvider {
  async createOrder(input: PaymentOrderInput): Promise<PaymentOrderResult> {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
    });

    return {
      providerOrderId: order.id,
      amount: input.amount,
      currency: input.currency,
      keyId: process.env.RAZORPAY_KEY_ID ?? "",
    };
  }

  verifySignature(input: VerifyPaymentInput): boolean {
    return validatePaymentVerification(
      { order_id: input.providerOrderId, payment_id: input.paymentId },
      input.signature,
      process.env.RAZORPAY_KEY_SECRET ?? "",
    );
  }

  async refund(paymentId: string, amount: number): Promise<RefundResult> {
    const razorpay = getRazorpayClient();
    const refund = await razorpay.payments.refund(paymentId, { amount });
    return { refundId: refund.id };
  }
}

export const paymentProvider: PaymentProvider = new RazorpayProvider();
