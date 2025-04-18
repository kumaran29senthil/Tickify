"use server";

import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Fetches the Razorpay account ID (sub-account ID) of the currently authenticated user.
 */
export async function getRazorpayConnectAccount() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const razorpayAccountId = await convex.query(api.users.getUsersRazorpayAccountId, {
    userId,
  });

  return {
    razorpayAccountId: razorpayAccountId || null,
  };
}
