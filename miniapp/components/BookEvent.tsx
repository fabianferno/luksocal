"use client";

import { useState, useEffect } from "react";
import React from "react";
import { createClientUPProvider } from "@lukso/up-provider";
import { lukso } from "wagmi/chains";
import { createWalletClient, createPublicClient, http, custom } from "viem";
import { luksoTestnet } from "viem/chains";
import { CAL_ADDRESS, CALABI } from "./const";
import { useUpProvider } from "./upProvider";

export type BookingResponse = {
  id: number;
  uid: string;
  idempotencyKey: string;
  userId: number;
  userPrimaryEmail: string;
  eventTypeId: number;
  title: string;
  description: string;
  customInputs: Record<string, unknown>;
  responses: {
    name: string;
    email: string;
    guests: any[];
    location: {
      value: string;
      optionValue: string;
    };
  };
  startTime: string;
  endTime: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  paid: boolean;
  destinationCalendarId: number;
  cancellationReason: string | null;
  rejectionReason: string | null;
  reassignReason: string | null;
  reassignById: number | null;
  dynamicEventSlugRef: string | null;
  dynamicGroupSlugRef: string | null;
  rescheduled: string | null;
  fromReschedule: string | null;
  recurringEventId: string | null;
  smsReminderNumber: string | null;
  scheduledJobs: any[];
  metadata: Record<string, unknown>;
  isRecorded: boolean;
  iCalUID: string;
  iCalSequence: number;
  rating: number | null;
  ratingFeedback: string | null;
  noShowHost: boolean;
  oneTimePassword: string | null;
  cancelledBy: string | null;
  rescheduledBy: string | null;
  creationSource: string;
  user: {
    email: string | null;
    name: string;
    timeZone: string;
    username: string;
  };
  attendees: Array<{
    id: number;
    email: string;
    name: string;
    timeZone: string;
    phoneNumber: string | null;
    locale: string;
    bookingId: number;
    noShow: boolean;
  }>;
  payment: any[];
  references: Array<{
    type: string;
    uid: string;
    meetingId: string;
    meetingPassword: string;
    meetingUrl: string;
    externalCalendarId?: string;
    credentialId?: number;
    thirdPartyRecurringEventId?: string | null;
  }>;
  appsStatus: Array<{
    appName: string;
    type: string;
    success: number;
    failures: number;
    errors: any[];
    warnings?: any[];
  }>;
  paymentRequired: boolean;
  luckyUsers: any[];
  isDryRun: boolean;
  videoCallUrl: string;
};

export function BookEvent({
  bookForm,
  setBookForm,
  onBack,
}: {
  bookForm: any;
  setBookForm: (f: any) => void;
  onBack?: () => void;
}) {
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accounts } = useUpProvider();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setBookForm({ ...bookForm, [e.target.name]: e.target.value });
  };

  const provider = createClientUPProvider();
  const walletClient = createWalletClient({
    chain: luksoTestnet,
    transport: custom(provider),
  });

  const publicClient = createPublicClient({
    chain: luksoTestnet,
    transport: http(),
  });

  const bookEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add Payment Method

    if (!accounts[0]) {
      console.log("No account selected");
      setError("No account selected");
      return;
    }
    console.log(accounts[0]);

    console.log(bookForm.user);

    const getUserDetails: any = await publicClient.readContract({
      address: CAL_ADDRESS,
      abi: CALABI,
      functionName: "getUserDetails",
      args: [bookForm.user],
    });

    console.log(getUserDetails);

    const tx = await walletClient?.writeContract({
      account: accounts[0],
      address: CAL_ADDRESS,
      abi: CALABI,
      functionName: "bookCall",
      args: [bookForm.user, 15],
      value: BigInt(getUserDetails[1]),
    });

    console.log(tx);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: tx!,
    });

    console.log(receipt);

    if (
      !bookForm.name ||
      !bookForm.email ||
      !bookForm.startTime ||
      !bookForm.eventTypeSlug ||
      !bookForm.user ||
      !bookForm.timeZone
    ) {
      setError("All fields are required");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Convert local startTime to UTC ISO string for API
      let startTimeUtc = bookForm._slotUtc;
      if (!startTimeUtc && bookForm.startTime) {
        // If _slotUtc is not set (e.g. user reloads), convert local to UTC
        const local = new Date(bookForm.startTime);
        startTimeUtc =
          new Date(local.getTime() - local.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16) + ":00.000Z";
      }
      const payload = { ...bookForm, startTime: startTimeUtc };
      delete payload._slotUtc;
      const response = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      const data = await response.json();
      setBookingResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to book event");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date/time
  function formatDateTime(dt: string) {
    if (!dt) return "";
    return new Date(dt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // Scroll to slot picker (EventData) when changing time
  function scrollToSlots() {
    if (onBack) onBack();
  }

  useEffect(() => {
    console.log(accounts);
  }, [accounts]);

  return (
    <div className="mt-8 p-10 bg-white border border-gray-300 rounded-3xl shadow-xl max-w-4xl w-full mx-auto flex flex-col items-center">
      {!bookingResult ? (
        <form onSubmit={bookEvent} className="w-full mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={bookForm.name}
              onChange={handleChange}
              className="border rounded px-5 py-4 text-black text-lg w-full"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={bookForm.email}
              onChange={handleChange}
              className="border rounded px-5 py-4 text-black text-lg w-full"
              required
            />
            <input
              type="text"
              name="user"
              placeholder="Cal.com Username"
              value={bookForm.user}
              onChange={handleChange}
              className="border rounded px-5 py-4 text-black text-lg w-full"
              required
            />
            <input
              type="text"
              name="eventTypeSlug"
              placeholder="Event Type Slug (e.g. 15min)"
              value={bookForm.eventTypeSlug}
              onChange={handleChange}
              className="border rounded px-5 py-4 text-black text-lg w-full"
              required
            />
            <input
              type="text"
              name="timeZone"
              placeholder="Time Zone (e.g. Europe/Amsterdam)"
              value={bookForm.timeZone}
              onChange={handleChange}
              className="border rounded px-5 py-4 text-black text-lg w-full md:col-span-2"
              required
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
            <div className="flex-1 border rounded px-5 py-4 bg-gray-100 text-black cursor-not-allowed text-lg w-full">
              <span className="font-medium">Selected Time:</span>{" "}
              {bookForm.startTime ? (
                formatDateTime(bookForm.startTime)
              ) : (
                <span className="text-gray-400">No time selected</span>
              )}
            </div>
            <button
              type="button"
              className="px-5 py-4 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg font-medium border border-gray-300 w-full md:w-auto"
              onClick={scrollToSlots}
            >
              Change time
            </button>
          </div>
          {/* Hidden input to keep startTime in form submission */}
          <input type="hidden" name="startTime" value={bookForm.startTime} />
          <div className="flex flex-row gap-4 mt-4 justify-end">
            {onBack && (
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-8 rounded-full border border-gray-400 text-lg"
                onClick={onBack}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-10 rounded-full text-lg shadow-md transition-all duration-150 disabled:opacity-60"
              disabled={loading || !bookForm.startTime}
            >
              {loading ? "Booking..." : "Book Event"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-6 rounded-xl w-full max-w-lg flex flex-col items-center gap-4">
          <h3 className="text-xl font-bold text-green-700 mb-2">
            Booking Confirmed!
          </h3>
          <div className="text-black text-center">
            <div className="font-semibold text-lg mb-1">
              {bookingResult.title}
            </div>
            <div className="mb-1">
              <span className="font-medium">Time:</span>{" "}
              {formatDateTime(bookingResult.startTime)} -{" "}
              {formatDateTime(bookingResult.endTime)}
            </div>
            <div className="mb-1">
              <span className="font-medium">Host:</span>{" "}
              {bookingResult.user.name} ({bookingResult.user.username})
            </div>
            <div className="mb-1">
              <span className="font-medium">Attendee:</span>{" "}
              {bookingResult.attendees[0]?.name} (
              {bookingResult.attendees[0]?.email})
            </div>
          </div>
          {bookingResult.videoCallUrl && (
            <a
              href={bookingResult.videoCallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow-md transition-all duration-150"
            >
              Join Video Call
            </a>
          )}
        </div>
      )}
      {error && (
        <div className="bg-gray-100 border border-gray-400 text-black px-4 py-3 rounded-xl mb-4 w-full text-center">
          Error: {error}
        </div>
      )}
    </div>
  );
}
