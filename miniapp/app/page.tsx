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

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');

  const fetchEventData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError("Username is required");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Use a very wide date range
      const startTime = '2020-01-01T00:00';
      const endTime = '2030-12-31T23:59';
      let url = `/api/event?username=${encodeURIComponent(username)}`;
      url += `&startTime=${encodeURIComponent(startTime)}`;
      url += `&endTime=${encodeURIComponent(endTime)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      const data = await response.json();
      setEventData(data);
      // Auto-select first available date if present
      const slots = getSlotsFromEventData(data);
      if (slots && Object.keys(slots).length > 0) {
        setSelectedDate(Object.keys(slots)[0]);
      } else {
        setSelectedDate(null);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch event data"
      );
    } finally {
      setLoading(false);
    }
  };

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
  const availableDates = slots ? Object.keys(slots) : [];
  const timesForSelectedDate = selectedDate && slots ? slots[selectedDate] : [];

  // Calendar grid for the month
  function renderCalendar() {
    if (!availableDates.length) return null;
    // Get the month and year from the first available date
    const firstDate = new Date(availableDates[0]);
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    // Find all days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Find the weekday of the 1st
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    // Calendar grid
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDayOfWeek).fill(null);
    function pad(n: number) { return n.toString().padStart(2, '0'); }
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center mb-2">
          <span className="text-lg font-semibold text-white mr-2">{firstDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
            <div key={d} className="text-xs text-gray-300 text-center">{d}</div>
          ))}
        </div>
        {weeks.map((w, i) => (
          <div key={i} className="grid grid-cols-7 gap-1 mb-1">
            {w.map((day, j) => {
              if (!day) return <div key={j} className="h-8" />;
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isAvailable = availableDates.includes(dateStr);
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={j}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors duration-100
                    ${isAvailable ? (isSelected ? 'bg-white text-black font-bold border-2 border-green-400' : 'bg-gray-700 text-white hover:bg-gray-500') : 'bg-gray-900 text-gray-500 cursor-not-allowed'}`}
                  disabled={!isAvailable}
                  onClick={() => {
                    if (isAvailable) setSelectedDate(dateStr);
                  }}
                >
                  {day}
                  {isAvailable && <span className="ml-1 text-green-400">•</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // Time selector for selected date
  function renderTimes() {
    if (!selectedDate || !timesForSelectedDate || !timesForSelectedDate.length) {
      return <div className="text-gray-400 text-center mt-4">No available times for this date.</div>;
    }
    return (
      <div className="flex flex-col gap-2 mt-2 w-full">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-semibold text-white">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <div className="ml-auto flex gap-1 bg-gray-800 rounded-lg p-1">
            <button
              className={`px-2 py-1 rounded ${timeFormat === '12h' ? 'bg-black text-white' : 'text-gray-300'}`}
              onClick={() => setTimeFormat('12h')}
              type="button"
            >12h</button>
            <button
              className={`px-2 py-1 rounded ${timeFormat === '24h' ? 'bg-black text-white' : 'text-gray-300'}`}
              onClick={() => setTimeFormat('24h')}
              type="button"
            >24h</button>
          </div>
        </div>
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {timesForSelectedDate.map((slot: any) => {
            const time = new Date(slot.time);
            const timeStr = timeFormat === '12h'
              ? time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
              : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            return (
              <button
                key={slot.time}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-green-900 text-white text-base font-medium transition-colors duration-150"
                type="button"
                onClick={() => {
                  setBookForm({
                    ...bookForm,
                    startTime: slot.time.slice(0, 16), // for datetime-local input (YYYY-MM-DDTHH:mm)
                    user: username,
                  });
                }}
              >
                <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                {timeStr}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-gray-900 border border-gray-700 rounded-3xl shadow-xl max-w-2xl mx-auto flex flex-col items-center">
      <h2 className="text-2xl text-left font-bold mb-4 text-white">Get slots to book</h2>
      <form onSubmit={fetchEventData} className="flex flex-col gap-2 w-full max-w-md mb-4">
        <input
          type="text"
          placeholder="Username (required)"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border rounded px-3 py-2 text-black"
          required
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
      {/* Calendar and time selector UI */}
      <div className="flex flex-row gap-8 w-full justify-center">
        <div>{renderCalendar()}</div>
        <div className="flex-1 min-w-[200px]">{renderTimes()}</div>
      </div>
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
    eventTypeSlug: "15min",
    user: "",
    timeZone: "Asia/Kolkata",
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
        <div className="p-6 bg-white border border-gray-300 rounded-3xl shadow-xl mt-8 w-full flex flex-col items-center">
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
