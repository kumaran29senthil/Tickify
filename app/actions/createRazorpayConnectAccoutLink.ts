// createRazorpayConnectAccountLink.ts
"use server";

import Razorpay from "razorpay";
import { headers } from "next/headers";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRazorpayConnectAccountLink(accountId: string) {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "";

    if (!accountId) {
      throw new Error("No Razorpay account ID provided");
    }

    // Razorpay does not support programmatic onboarding links like Stripe.
    // You'll redirect users to the Partner Dashboard to complete onboarding.
    const onboardingUrl = `https://dashboard.razorpay.com/app/partners/onboarding/${accountId}`;

    return { url: onboardingUrl };
  } catch (error) {
    console.error(
      "An error occurred when creating Razorpay Connect onboarding link:",
      error
    );
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred");
  }
}
