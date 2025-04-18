"use server";

import { razorpay } from "@/lib/razorpay";

/**
 * Generates a manual login link to the Razorpay dashboard for the connected account.
 * Note: Razorpay doesn’t have an official login link API like Stripe.
 */
export async function createRazorpayConnectLoginLink(razorpayAccountId: string) {
  if (!razorpayAccountId) {
    throw new Error("No Razorpay account ID provided");
  }

  try {
    // This URL format gives access to the merchant dashboard for connected accounts.
    const loginLink = `https://dashboard.razorpay.com/merchant/${razorpayAccountId}/login`;

    return loginLink;
  } catch (error) {
    console.error("Error generating Razorpay login link:", error);
    throw new Error("Failed to generate Razorpay Connect login link");
  }
}

export default createRazorpayConnectLoginLink;