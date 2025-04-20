import crypto from "crypto";
import { NextRequest } from "next/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

// Type definitions matching your Convex schema
interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

interface PurchaseTicketArgs {
  eventId: string;
  userId: string;
  waitingListId: string;
  payment: PaymentData;
}

export async function POST(req: NextRequest) {
  // 1. Validate webhook secret
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    // 2. Get and verify webhook signature
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return new Response("Missing signature header", { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      return new Response("Invalid signature", { status: 401 });
    }

    // 3. Parse and validate event
    const event = JSON.parse(body);
    if (event.event !== "payment.captured") {
      return new Response(`Ignoring event type: ${event.event}`, { status: 200 });
    }

    const payment = event.payload.payment.entity;

    // 4. Validate required fields
    if (!payment.notes?.eventId || !payment.notes?.userId) {
      console.error("Missing required fields in payment notes", payment.notes);
      return new Response("Missing eventId or userId", { status: 400 });
    }

    // 5. Prepare Convex mutation data
    const args: PurchaseTicketArgs = {
      eventId: payment.notes.eventId,
      userId: payment.notes.userId,
      waitingListId: payment.notes.waitingListId || "",
      payment: {
        id: payment.id,
        amount: payment.amount / 100, // Convert paise to rupees
        currency: payment.currency || "INR",
        status: payment.status || "completed"
      }
    };

    // 6. Execute Convex mutation
    const convex = getConvexClient();
    const result = await convex.mutation(api.events.purchaseTicket, event);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Webhook processing failed:", error);
    return new Response(
      error instanceof Error ? error.message : "Unknown error",
      { status: 500 }
    );
  }
}