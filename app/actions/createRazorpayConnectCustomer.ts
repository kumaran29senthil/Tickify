// createRazorpayConnectCustomer.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function createRazorpayConnectCustomer() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const existingRazorpayContactId = await convex.query(
    api.users.getUsersRazorpayContactId,
    { userId }
  );

  if (existingRazorpayContactId) {
    return { contact: existingRazorpayContactId };
  }

  const firstName = sessionClaims?.firstName as string | undefined;
  const lastName = sessionClaims?.lastName as string | undefined;
  const email = sessionClaims?.email as string | undefined;
  const phoneNumber = sessionClaims?.phoneNumber as string | undefined;

  const userRole = sessionClaims?.role as "buyer" | "seller" | undefined;

  const contactType =
    userRole === "seller"
      ? "vendor"
      : userRole === "buyer"
      ? "customer"
      : "customer"; // default to customer

  const response = await fetch("https://api.razorpay.com/v1/contacts", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${firstName ?? ""} ${lastName ?? ""}`.trim() || "User",
      email: email || "user@example.com",
      contact: phoneNumber || "9999999999",
      type: contactType,
      reference_id: userId,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Failed to create Razorpay contact: " + err);
  }

  const data = await response.json();

  await convex.mutation(api.users.updateOrCreateUserRazorpayContactId, {
    userId,
    razorpayContactId: data.id,
  });

  return { contact: data.id };
}
