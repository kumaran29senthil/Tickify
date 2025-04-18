// createRazorpayCheckoutSession.ts
"use server";

import Razorpay from "razorpay";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import baseUrl from "@/lib/baseUrl";
import { auth } from "@clerk/nextjs/server";

export type RazorpayCheckoutMetaData = {
  eventId: Id<"events">;
  userId: string;
  waitingListId: Id<"waitingList">;
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRazorpayCheckoutSession({
  eventId,
}: {
  eventId: Id<"events">;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const convex = getConvexClient();

  const event = await convex.query(api.events.getById, { eventId });
  if (!event) throw new Error("Event not found");

  const queuePosition = await convex.query(api.waitinglist.getQueuePosition, {
    eventId,
    userId,
  });

  if (!queuePosition || queuePosition.status !== "offered") {
    throw new Error("No valid ticket offer found");
  }

  if (!queuePosition.offerExpiresAt) {
    throw new Error("Ticket offer has no expiration date");
  }

  // 🧩 Seller's Razorpay sub-account (Connect)
  const razorpayAccountId = await convex.query(
    api.users.getUsersRazorpayContactId,
    { userId: event.userId }
  );
  if (!razorpayAccountId) {
    throw new Error("Razorpay Account ID not found for seller");
  }

  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64"),
      "Content-Type": "application/json",
      "X-Razorpay-Account": razorpayAccountId, // Razorpay Connect key here!
    },
    body: JSON.stringify({
      amount: Math.round(event.price * 100),
      currency: "INR",
      receipt: `rcpt_${eventId}_${userId}`,
      payment_capture: true,
      notes: {
        eventId,
        userId,
        waitingListId: queuePosition._id,
      },
    }),
  });

  const order = await orderRes.json();

  return {
    orderId: order.id,
    razorpayKey: process.env.RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: event.name,
    description: event.description,
    successUrl: `${baseUrl}/tickets/purchase-success?order_id=${order.id}`,
    cancelUrl: `${baseUrl}/event/${eventId}`,
  };
}

export default createRazorpayCheckoutSession;