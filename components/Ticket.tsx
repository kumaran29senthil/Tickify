"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { CalendarDays, IdCard, MapPin, Ticket as TicketIcon, User } from "lucide-react";
// import QRCode from "react-qr-code";
import Spinner from "./Spinner";
import { useStorageUrl } from "@/lib/utils";
import Image from "next/image";

interface TicketProps {
  ticketId: Id<"tickets">;
}

export default function Ticket({ ticketId }: TicketProps) {
  const ticket = useQuery(api.tickets.getTicketWithDetails, { ticketId });
  const user = useQuery(api.users.getUserById, {
    userId: ticket?.userId ?? "",
  });
  const imageUrl = useStorageUrl(ticket?.event?.imageStorageId);

  if (!ticket || !ticket.event || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  const { event } = ticket;
  const isCancelled = event.is_cancelled;
  const primaryColor = isCancelled ? "red" : "blue";
  const formattedDate = new Date(event.eventDate).toLocaleDateString();
  const formattedPurchaseDate = new Date(ticket.purchasedAt).toLocaleString();

  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-xl border ${isCancelled ? "border-red-200" : "border-gray-100"}`}>
      {/* Event Header with Image */}
      <div className="relative">
        {imageUrl && (
          <div className="relative w-full aspect-[21/9]">
            <Image
              src={imageUrl}
              alt={event.name}
              fill
              className={`object-cover object-center ${isCancelled ? "opacity-50" : ""}`}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/90" />
          </div>
        )}
        <div className={`px-6 py-4 ${imageUrl ? "absolute bottom-0 left-0 right-0" : isCancelled ? "bg-red-600" : "bg-blue-600"}`}>
          <h2 className="text-2xl font-bold text-white">
            {event.name}
          </h2>
          {isCancelled && (
            <p className="text-red-300 mt-1">This event has been cancelled</p>
          )}
        </div>
      </div>

      {/* Ticket Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Event Details */}
          <div className="space-y-4">
            <DetailItem 
              icon={<CalendarDays className={`w-5 h-5 text-${primaryColor}-600`} />}
              label="Date"
              value={formattedDate}
            />
            
            <DetailItem 
              icon={<MapPin className={`w-5 h-5 text-${primaryColor}-600`} />}
              label="Location"
              value={event.location}
            />
            
            <DetailItem 
              icon={<User className={`w-5 h-5 text-${primaryColor}-600`} />}
              label="Ticket Holder"
              value={user.name}
              secondaryValue={user.email}
            />
            
            <DetailItem 
              icon={<IdCard className={`w-5 h-5 text-${primaryColor}-600`} />}
              label="Ticket Holder ID"
              value={user.userId}
              breakAll
            />
            
            <DetailItem 
              icon={<TicketIcon className={`w-5 h-5 text-${primaryColor}-600`} />}
              label="Ticket Price"
              value={`£${event.price.toFixed(2)}`}
            />
          </div>

          {/* Right Column - QR Code */}
          <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-6">
            <div className={`bg-gray-100 p-4 rounded-lg ${isCancelled ? "opacity-50" : ""}`}>
              {/* <QRCode  */}
                value={ticket._id} 
                size={128}
                level="H"
                fgColor={isCancelled ? "#dc2626" : "#2563eb"}
              {/* /> */}
            </div>
            <p className="mt-2 text-sm text-gray-500 break-all text-center max-w-[200px]">
              Ticket ID: {ticket._id}
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Important Information
          </h3>
          {isCancelled ? (
            <p className="text-sm text-red-600">
              This event has been cancelled. A refund will be processed if it hasn't been already.
            </p>
          ) : (
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Please arrive at least 30 minutes before the event</li>
              <li>• Have your ticket QR code ready for scanning</li>
              <li>• This ticket is non-transferable</li>
            </ul>
          )}
        </div>
      </div>

      {/* Ticket Footer */}
      <div className={`${isCancelled ? "bg-red-50" : "bg-gray-50"} px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2`}>
        <span className="text-sm text-gray-500">
          Purchase Date: {formattedPurchaseDate}
        </span>
        <span className={`text-sm font-medium ${isCancelled ? "text-red-600" : "text-blue-600"}`}>
          {isCancelled ? "Cancelled" : "Valid Ticket"}
        </span>
      </div>
    </div>
  );
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  secondaryValue?: string;
  breakAll?: boolean;
}

function DetailItem({ icon, label, value, secondaryValue, breakAll }: DetailItemProps) {
  return (
    <div className="flex items-start text-gray-600">
      <div className="mr-3 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`font-medium ${breakAll ? "break-all" : ""}`}>{value}</p>
        {secondaryValue && (
          <p className="text-sm text-gray-500">{secondaryValue}</p>
        )}
      </div>
    </div>
  );
}