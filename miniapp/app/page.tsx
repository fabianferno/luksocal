"use client";

import { UpProvider } from "@/components/upProvider";
import { Donate } from "@/components/Donate";
import { ProfileSearch } from "@/components/ProfileSearch";
import { useUpProvider } from "@/components/upProvider";
import { useState, useEffect } from "react";
import React from "react";
import { useSearchParams } from "next/navigation";

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
function EventData({ setBookForm, bookForm, username }: { setBookForm: (f: any) => void, bookForm: any, username: string | null }) {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');

  // Calendar state
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());

  // Helper to get start/end of month in YYYY-MM-DDTHH:mm format
  function getMonthRange(year: number, month: number) {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00`;
    const endDate = new Date(year, month + 1, 0);
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T23:59`;
    return { start, end };
  }

  // Fetch slots for the selected month
  const fetchEventData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username) {
      setError("No profileId provided in the URL.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { start, end } = getMonthRange(calendarYear, calendarMonth);
      let url = `/api/event?username=${encodeURIComponent(username)}`;
      url += `&startTime=${encodeURIComponent(start)}`;
      url += `&endTime=${encodeURIComponent(end)}`;
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

  // Fetch slots when month or username changes
  useEffect(() => {
    if (username) {
      fetchEventData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth, calendarYear, username]);

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
    // Use calendarMonth/calendarYear for the grid
    const year = calendarYear;
    const month = calendarMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
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
        <div className="flex items-center mb-2 gap-2">
          <button
            className="px-2 py-1 rounded bg-gray-800 text-white hover:bg-gray-600"
            onClick={() => {
              if (calendarMonth === 0) {
                setCalendarMonth(11);
                setCalendarYear(calendarYear - 1);
              } else {
                setCalendarMonth(calendarMonth - 1);
              }
            }}
            type="button"
          >
            &lt;
          </button>
          <span className="text-lg font-semibold text-white mr-2">{new Date(calendarYear, calendarMonth).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
          <button
            className="px-2 py-1 rounded bg-gray-800 text-white hover:bg-gray-600"
            onClick={() => {
              if (calendarMonth === 11) {
                setCalendarMonth(0);
                setCalendarYear(calendarYear + 1);
              } else {
                setCalendarMonth(calendarMonth + 1);
              }
            }}
            type="button"
          >
            &gt;
          </button>
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
                    if (isAvailable) {
                      setSelectedDate(dateStr);
                      setBookForm({
                        ...bookForm,
                        startTime: dateStr,
                        _slotUtc: dateStr,
                      });
                    }
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
            const time = new Date(slot.time); // slot.time is UTC ISO string
            const timeStr = timeFormat === '12h'
              ? time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
              : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            // Convert UTC slot time to local datetime-local string
            function toLocalDatetimeString(date: Date) {
              const pad = (n: number) => n.toString().padStart(2, '0');
              return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            }
            return (
              <button
                key={slot.time}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-green-900 text-white text-base font-medium transition-colors duration-150"
                type="button"
                onClick={() => {
                  setBookForm({
                    ...bookForm,
                    startTime: toLocalDatetimeString(time), // local time string for datetime-local input
                    user: username,
                    _slotUtc: slot.time, // store original UTC for later use
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
      {!username ? (
        <div className="bg-gray-100 border border-gray-400 text-black px-4 py-3 rounded-xl mb-4 w-full text-center">
          No profileId provided in the URL.
        </div>
      ) : error ? (
        <div className="bg-gray-100 border border-gray-400 text-black px-4 py-3 rounded-xl mb-4 w-full text-center">
          Error: {error}
        </div>
      ) : null}
      {username && !error && (
        <div className="flex flex-row gap-8 w-full justify-center">
          <div>{renderCalendar()}</div>
          <div className="flex-1 min-w-[200px]">{loading ? <div className="text-white text-center mt-8">Loading...</div> : renderTimes()}</div>
        </div>
      )}
      {eventData && !slots && (
        <div className="text-gray-500 text-center mt-4">No available slots found.</div>
      )}
    </div>
  );
}

// Define the type for the booking response
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

/**
 * Component to book an event through Cal.com
 * Now uses a form for all booking fields
 */
function BookEvent({ bookForm, setBookForm, onBack }: { bookForm: any, setBookForm: (f: any) => void, onBack?: () => void }) {
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
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
      // Convert local startTime to UTC ISO string for API
      let startTimeUtc = bookForm._slotUtc;
      if (!startTimeUtc && bookForm.startTime) {
        // If _slotUtc is not set (e.g. user reloads), convert local to UTC
        const local = new Date(bookForm.startTime);
        startTimeUtc = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString().slice(0, 16) + ':00.000Z';
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
    if (!dt) return '';
    return new Date(dt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // Scroll to slot picker (EventData) when changing time
  function scrollToSlots() {
    if (onBack) onBack();
  }

  return (
    <div className="mt-8 p-6 bg-white border border-gray-300 rounded-3xl shadow-xl max-w-2xl mx-auto flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-black">Book a slot</h2>
      {!bookingResult ? (
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
          {/* Show selected time as plain text, not editable */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border rounded px-3 py-2 bg-gray-100 text-black cursor-not-allowed">
              <span className="font-medium">Selected Time:</span> {bookForm.startTime ? formatDateTime(bookForm.startTime) : <span className="text-gray-400">No time selected</span>}
            </div>
            <button
              type="button"
              className="ml-2 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium border border-gray-300"
              onClick={scrollToSlots}
            >
              Change time
            </button>
          </div>
          {/* Hidden input to keep startTime in form submission */}
          <input type="hidden" name="startTime" value={bookForm.startTime} />
          <input
            type="text"
            name="timeZone"
            placeholder="Time Zone (e.g. Europe/Amsterdam)"
            value={bookForm.timeZone}
            onChange={handleChange}
            className="border rounded px-3 py-2 text-black"
            required
          />
          <div className="flex flex-row gap-2 mt-2">
            {onBack && (
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-full border border-gray-400"
                onClick={onBack}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-full text-lg shadow-md transition-all duration-150 disabled:opacity-60"
              disabled={loading || !bookForm.startTime}
            >
              {loading ? "Booking..." : "Book Event"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-6 rounded-xl w-full max-w-lg flex flex-col items-center gap-4">
          <h3 className="text-xl font-bold text-green-700 mb-2">Booking Confirmed!</h3>
          <div className="text-black text-center">
            <div className="font-semibold text-lg mb-1">{bookingResult.title}</div>
            <div className="mb-1">
              <span className="font-medium">Time:</span> {formatDateTime(bookingResult.startTime)} - {formatDateTime(bookingResult.endTime)}
            </div>
            <div className="mb-1">
              <span className="font-medium">Host:</span> {bookingResult.user.name} ({bookingResult.user.username})
            </div>
            <div className="mb-1">
              <span className="font-medium">Attendee:</span> {bookingResult.attendees[0]?.name} ({bookingResult.attendees[0]?.email})
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
  const [loading, setLoading] = useState(false);

  // BookEvent form state lifted here
  const [bookForm, setBookForm] = useState({
    name: "",
    email: "",
    startTime: "",
    eventTypeSlug: "15min",
    user: "",
    timeZone: "Asia/Kolkata",
    _slotUtc: undefined,
  });

  // Step state: 1 = choose slot, 2 = add details/confirm
  const [step, setStep] = useState<1 | 2>(1);

  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId");
  let username: string | null = null;
  if (profileId) {
    try {
      username = atob(profileId);
    } catch {
      username = null;
    }
  }

  useEffect(() => {
    promise?.then(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    async function fetchDirectProfile() {
      if (!username) {
        setProfileData(null);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/profile/${username}`);
        if (!response.ok) {
          setProfileData(null);
          setLoading(false);
          return;
        }
        const data = await response.json();
        if (data) {
          setProfileData(data);
        } else {
          setProfileData(null);
        }
      } catch {
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    }
    if (mounted) {
      fetchDirectProfile();
    }
  }, [mounted, username]);

  const { isSearching } = useUpProvider();

  // Reset to step 1 if slot is cleared
  useEffect(() => {
    if (!bookForm.startTime) {
      setStep(1);
    }
  }, [bookForm.startTime]);

  if (!mounted) {
    return null;
  }

  // Show loader while loading
  if (loading) {
    return (
      <main className="flex flex-col items-center w-full min-h-screen pb-16 pt-4 md:pt-10">
        <div className="p-6 bg-white border border-gray-300 rounded-3xl shadow-xl mt-8 w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2 text-black">Loading...</h2>
        </div>
      </main>
    );
  }

  // Show error UI if no profileId or no profile data
  if (!username) {
    return (
      <main className="flex flex-col items-center w-full min-h-screen pb-16 pt-4 md:pt-10">
        <div className="p-6 bg-white border border-gray-300 rounded-3xl shadow-xl mt-8 w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2 text-black">No profileId provided</h2>
          <p className="text-gray-700 text-center text-lg">Please provide a valid profileId in the URL.</p>
        </div>
      </main>
    );
  }
  if (!profileData && !loading) {
    return (
      <main className="flex flex-col items-center w-full min-h-screen pb-16 pt-4 md:pt-10">
        <div className="p-6 bg-white border border-gray-300 rounded-3xl shadow-xl mt-8 w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2 text-black">Profile not found</h2>
          <p className="text-gray-700 text-center text-lg">No data found for the provided profileId.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center w-full min-h-screen  pb-16 pt-4 md:pt-10">
      <div className={`${isSearching ? "hidden" : "block"}`}></div>
      {/* Profile Card */}
      {profileData && (
        <div className="p-6 bg-white border border-gray-300 rounded-3xl shadow-xl mt-8 w-full flex flex-row items-start gap-6">
          {profileData.image && (
            <img
              src={profileData.image}
              alt={profileData.name}
              className="w-48 h-48 object-cover border-2 border-gray-300 rounded-xl shadow-md"
              style={{ display: 'block' }}
            />
          )}
          <div className="flex flex-col">
            <h2 className="text-2xl mb-2 text-black">Book a slot with <span className="font-bold">{profileData.name}</span></h2>
            <div className="text-gray-700 text-lg">
              {String(profileData.bio).slice(0, 250) + '...'}
            </div>

            <p className="text-sm text-gray-500 mt-4">Powered by LUKSOCAL</p>
          </div>
        </div>
      )}
      <div className="flex flex-row gap-4">
        {step === 1 && (
          <EventData
            setBookForm={(f: any) => {
              setBookForm(f);
              setStep(2); // advance to step 2 after slot selection
            }}
            bookForm={bookForm}
            username={username}
          />
        )}
        {step === 2 && (
          <BookEvent
            setBookForm={(f: any) => setBookForm(f)}
            bookForm={bookForm}
            onBack={() => {
              setBookForm({ ...bookForm, startTime: '', _slotUtc: undefined });
              setStep(1);
            }}
          />
        )}
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
