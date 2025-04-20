"use server";

import { razorpay } from "@/lib/razorpay"; // Assuming you have a Razorpay client setup
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function refundEventTickets(eventId: Id<"events">) {
  const convex = getConvexClient();

  // Get event details
  const event = await convex.query(api.events.getById, { eventId });
  if (!event) throw new Error("Event not found");

  // Get event owner's Razorpay account ID (if needed)
  // Note: Razorpay doesn't use Connect like Stripe, but you might store merchant IDs
  const razorpayAccountId = await convex.query(
    api.users.getUsersRazorpayAccountId,
    {
      userId: event.userId,
    }
  );

  // Get all valid tickets for this event
  const tickets = await convex.query(api.tickets.getValidTicketsForEvent, {
    eventId,
  });

  // Process refunds for each ticket
  const results = await Promise.allSettled(
    tickets.map(async (ticket) => {
      try {
        // if (!ticket.paymentId) { // Razorpay typically uses 'paymentId' instead of 'paymentIntentId'
        //   throw new Error("Payment information not found");
        // }

        // Issue refund through Razorpay
        // const refund = await razorpay.payments.refund(ticket.paymentId, {
        //   amount: ticket.amount, // Razorpay requires amount in paise (smallest currency unit)
        //   speed: "normal", // or "optimum" for faster processing
        //   notes: {
        //     reason: "Event cancellation",
        //     ticketId: ticket._id
        //   }
        // });

        // Update ticket status to refunded
        await convex.mutation(api.tickets.updateTicketStatus, {
          ticketId: ticket._id,
          status: "refunded",
        });

        return { success: true, ticketId: ticket._id };
      } catch (error) {
        console.error(`Failed to refund ticket ${ticket._id}:`, error);
        return { success: false, ticketId: ticket._id, error };
      }
    })
  );

  // Check if all refunds were successful
  const allSuccessful = results.every(
    (result) => result.status === "fulfilled" && result.value.success
  );

  if (!allSuccessful) {
    throw new Error(
      "Some refunds failed. Please check the logs and try again."
    );
  }

  // Cancel the event instead of deleting it
  await convex.mutation(api.events.cancelEvent, { eventId });

  return { success: true };
}