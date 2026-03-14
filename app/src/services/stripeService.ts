/**
 * Stripe service for canvas print payments (physical goods).
 *
 * Apple/Google allow external payment processors for physical goods.
 * Install when ready: npm install @stripe/stripe-js
 */

import { ENV } from "@/config/env";

let stripePromise: Promise<any> | null = null;
const STRIPE_MODULE = "@stripe/stripe-js";

function getStripe() {
  if (!stripePromise && ENV.STRIPE_PUBLISHABLE_KEY) {
    stripePromise = import(/* @vite-ignore */ STRIPE_MODULE).then(({ loadStripe }) =>
      loadStripe(ENV.STRIPE_PUBLISHABLE_KEY)
    ).catch(() => null);
  }
  return stripePromise;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  orderId: string;
}

export async function createPaymentIntent(params: {
  courseId: string;
  styleId: string;
  canvasSize: string;
  shippingAddress: Record<string, string>;
}): Promise<PaymentIntentResponse> {
  const res = await fetch(`${ENV.COURSE_API_URL.replace("/api", "")}/api/orders/create-payment-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to create payment intent");
  return res.json();
}

export async function confirmPayment(clientSecret: string): Promise<boolean> {
  const stripe = await getStripe();
  if (!stripe) {
    console.warn("Stripe not configured — mock payment success");
    return true;
  }

  const { error } = await stripe.confirmPayment({
    clientSecret,
    confirmParams: { return_url: window.location.origin + "/confirmation" },
  });
  return !error;
}
