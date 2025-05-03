"use client";

import { UpProvider } from "@/components/upProvider";
import { Donate } from "@/components/Donate";
import { ProfileSearch } from "@/components/ProfileSearch";
import { useUpProvider } from "@/components/upProvider";
import { useState, useEffect } from "react";
import React from "react";

// Import the LUKSO web-components library
let promise: Promise<unknown> | null = null;
if (typeof window !== "undefined") {
  promise = import("@lukso/web-components");
}

/**
 * Fetches profile data from Cal.com for a given username using our API endpoint
 * @param username The Cal.com username to fetch data for
 * @returns Profile data including name, username, image and bio if available
 */
export async function fetchProfileData(username: string) {
  try {
    // Use the JSON API endpoint to get processed profile data
    const response = await fetch(`/api/profile/${username}`);
    if (!response.ok) return null;

    // Parse the JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return null;
  }
}

// Add a footer component for the app
function AppFooter() {
  return (
    <footer className="w-full py-4 flex justify-center items-center mt-12">
      <span className="text-xs text-gray-400">Powered by LUKSOCAL – Schedule meetings right from your Universal Profile</span>
    </footer>
  );
}

/**
 * Component to display Cal.com event information
 * Now uses a form for username and optional date range
 */
function EventData({ setBookForm, bookForm }: { setBookForm: (f: any) => void, bookForm: any }) {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  // Default to current week
  const getDefaultWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day; // Sunday=0, Monday=1
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const toLocalInput = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return {
      start: toLocalInput(monday),
      end: toLocalInput(sunday),
    };
  };
  const defaultWeek = getDefaultWeek();
  const [startTime, setStartTime] = useState(defaultWeek.start);
  const [endTime, setEndTime] = useState(defaultWeek.end);

  const fetchEventData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError("Username is required");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let url = `/api/event?username=${encodeURIComponent(username)}`;
      if (startTime) url += `&startTime=${encodeURIComponent(startTime)}`;
      if (endTime) url += `&endTime=${encodeURIComponent(endTime)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      const data = await response.json();
      setEventData(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch event data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper to render slots in a calendar-like grid
  function renderSlots(slotsObj: any) {
    if (!slotsObj || Object.keys(slotsObj).length === 0) {
      return <div className="text-gray-500 text-center mt-4">No available slots for this week.</div>;
    }
    return (
      <div className="w-full flex flex-col gap-6 mt-4">
        {Object.entries(slotsObj).map(([date, slots]: [string, any]) => (
          <div key={date} className="w-full">
            <div className="font-semibold text-lg text-black mb-2">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot: any) => {
                const time = new Date(slot.time);
                return (
                  <button
                    key={slot.time}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-black hover:text-white transition-colors duration-150 text-sm font-medium shadow-sm"
                    style={{ minWidth: 90 }}
                    type="button"
                    onClick={() => {
                      setBookForm({
                        ...bookForm,
                        startTime: slot.time.slice(0, 16), // for datetime-local input (YYYY-MM-DDTHH:mm)
                        user: username,
                      });
                    }}
                  >
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Extract slots from Cal.com API response structure
  function getSlotsFromEventData(data: any) {
    if (!data) return null;
    if (data.result && data.result.data && data.result.data.json && data.result.data.json.slots) {
      return data.result.data.json.slots;
    }
    if (data.slots) return data.slots;
    return null;
  }

  const slots = getSlotsFromEventData(eventData);

  return (
    <div className="mt-8 p-6 bg-white border border-gray-300 rounded-3xl shadow-xl max-w-2xl mx-auto flex flex-col items-center">
      <h2 className="text-2xl text-left font-bold mb-4 text-black">Get slots to book</h2>
      <form onSubmit={fetchEventData} className="flex flex-col gap-2 w-full max-w-md mb-4">
        <input
          type="text"
          placeholder="Username (required)"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border rounded px-3 py-2 text-black"
          required
        />
        <input
          type="datetime-local"
          placeholder="Start Time (optional)"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        />
        <input
          type="datetime-local"
          placeholder="End Time (optional)"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        />
        <button
          type="submit"
          className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-full text-lg shadow-md transition-all duration-150 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Loading..." : "Fetch Event Data"}
        </button>
      </form>
      {error && (
        <div className="bg-gray-100 border border-gray-400 text-black px-4 py-3 rounded-xl mb-4 w-full text-center">
          Error: {error}
        </div>
      )}
      {slots && renderSlots(slots)}
      {eventData && !slots && (
        <div className="text-gray-500 text-center mt-4">No available slots found.</div>
      )}
    </div>
  );
}

/**
 * Component to book an event through Cal.com
 * Now uses a form for all booking fields
 */
function BookEvent({ bookForm, setBookForm }: { bookForm: any, setBookForm: (f: any) => void }) {
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBookForm({ ...bookForm, [e.target.name]: e.target.value });
  };

  const bookEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.name || !bookForm.email || !bookForm.startTime || !bookForm.eventTypeSlug || !bookForm.user || !bookForm.timeZone) {
      setError("All fields are required");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookForm),
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

  return (
    <div className="mt-8 p-6 bg-white border border-gray-300 rounded-3xl shadow-xl max-w-2xl mx-auto flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-black">Book a slot</h2>
      <form onSubmit={bookEvent} className="flex flex-col gap-2 w-full max-w-md mb-4">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={bookForm.name}
          onChange={handleChange}
          className="border rounded px-3 py-2 text-black"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={bookForm.email}
          onChange={handleChange}
          className="border rounded px-3 py-2 text-black"
          required
        />
        <input
          type="text"
          name="user"
          placeholder="Cal.com Username"
          value={bookForm.user}
          onChange={handleChange}
          className="border rounded px-3 py-2 text-black"
          required
        />
        <input
          type="text"
          name="eventTypeSlug"
          placeholder="Event Type Slug (e.g. 15min)"
          value={bookForm.eventTypeSlug}
          onChange={handleChange}
          className="border rounded px-3 py-2 text-black"
          required
        />
        <input
          type="datetime-local"
          name="startTime"
          placeholder="Start Time"
          value={bookForm.startTime}
          onChange={handleChange}
          className="border rounded px-3 py-2 text-black"
          required
        />
        <input
          type="text"
          name="timeZone"
          placeholder="Time Zone (e.g. Europe/Amsterdam)"
          value={bookForm.timeZone}
          onChange={handleChange}
          className="border rounded px-3 py-2 text-black"
          required
        />
        <button
          type="submit"
          className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-full text-lg shadow-md transition-all duration-150 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Booking..." : "Book Event"}
        </button>
      </form>
      {error && (
        <div className="bg-gray-100 border border-gray-400 text-black px-4 py-3 rounded-xl mb-4 w-full text-center">
          Error: {error}
        </div>
      )}
      {bookingResult && (
        <div className="bg-gray-50 p-4 rounded-xl w-full overflow-x-auto">
          <pre className="text-xs md:text-sm overflow-auto max-h-60 text-black">
            {JSON.stringify(bookingResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Main content component that handles the conditional rendering of Donate and ProfileSearch components.
 * Utilizes the UpProvider context to manage selected addresses and search state.
 *
 * @component
 * @returns {JSX.Element} A component that toggles between Donate and ProfileSearch views
 * based on the isSearching state from UpProvider.
 */
function MainContent() {
  const [mounted, setMounted] = useState(false);
  const [profileData, setProfileData] = useState<
    | {
      name: string;
      username: string;
      image: string;
      bio: string;
    }
    | null
    | undefined
  >(null);

  // BookEvent form state lifted here
  const [bookForm, setBookForm] = useState({
    name: "",
    email: "",
    startTime: "",
    eventTypeSlug: "",
    user: "",
    timeZone: "",
  });

  useEffect(() => {
    promise?.then(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    async function fetchDirectProfile() {
      try {
        const username = "fabianferno";
        const response = await fetch(`/api/profile/${username}`);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (data) {
          setProfileData(data);
        }
      } catch {
        // silent
      }
    }
    if (mounted) {
      fetchDirectProfile();
    }
  }, [mounted]);

  const { isSearching } = useUpProvider();

  if (!mounted) {
    return null;
  }

  return (
    <main className="flex flex-col items-center w-full min-h-screen  pb-16 pt-4 md:pt-10">
      <div className={`${isSearching ? "hidden" : "block"}`}></div>
      {/* Profile Card */}
      {profileData && (
        <div className="p-6 bg-white border border-gray-300 rounded-3xl shadow-xl mt-8 max-w-2xl w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2 text-black">{profileData.name}</h2>
          {profileData.image && (
            <img
              src={profileData.image}
              alt={profileData.name}
              className="w-auto max-w-full max-h-80 object-contain mb-4 border-2 border-gray-300 rounded-xl shadow-md"
              style={{ display: 'block' }}
            />
          )}
          <p className="text-gray-700 text-center text-lg">{profileData.bio}</p>
        </div>
      )}
      <div className="flex flex-row gap-4">
        <EventData setBookForm={setBookForm} bookForm={bookForm} />
        <BookEvent setBookForm={setBookForm} bookForm={bookForm} />
      </div>
    </main>
  );
}

/**
 * Root component of the application that wraps the main content with the UpProvider context.
 * Serves as the entry point for the donation and profile search functionality.
 *
 * @component
 * @returns {JSX.Element} The wrapped MainContent component with UpProvider context
 */
export default function Home() {
  return (
    <UpProvider>
      <div className="min-h-screen flex flex-col items-center">
        <MainContent />
        <AppFooter />
      </div>
    </UpProvider>
  );
}
