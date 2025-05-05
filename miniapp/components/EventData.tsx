"use client";

import { useState, useEffect } from "react";
import React from "react";

export function EventData({
  setBookForm,
  bookForm,
  username,
}: {
  setBookForm: (f: any) => void;
  bookForm: any;
  username: string | null;
}) {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");

  // Calendar state
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());

  // Helper to get start/end of month in YYYY-MM-DDTHH:mm format
  function getMonthRange(year: number, month: number) {
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01T00:00`;
    const endDate = new Date(year, month + 1, 0);
    const end = `${endDate.getFullYear()}-${String(
      endDate.getMonth() + 1
    ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}T23:59`;
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
    if (
      data.result &&
      data.result.data &&
      data.result.data.json &&
      data.result.data.json.slots
    ) {
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
    function pad(n: number) {
      return n.toString().padStart(2, "0");
    }
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
          <span className="text-lg font-semibold text-white mr-2">
            {new Date(calendarYear, calendarMonth).toLocaleString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </span>
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
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div
              key={d}
              className="text-base text-gray-300 text-center font-semibold"
            >
              {d}
            </div>
          ))}
        </div>
        {weeks.map((w, i) => (
          <div key={i} className="grid grid-cols-7 gap-2 mb-2">
            {w.map((day, j) => {
              if (!day) return <div key={j} className="h-14" />;
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isAvailable = availableDates.includes(dateStr);
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={j}
                  className={`h-14 w-14 rounded-lg flex items-center justify-center text-lg font-bold transition-colors duration-100
                    ${
                      isAvailable
                        ? isSelected
                          ? "bg-white text-black font-bold border-2 border-green-400"
                          : "bg-gray-700 text-white hover:bg-gray-500"
                        : "bg-gray-900 text-gray-500 cursor-not-allowed"
                    }`}
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
                  {isAvailable && (
                    <span className="ml-1 text-green-400">•</span>
                  )}
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
    if (
      !selectedDate ||
      !timesForSelectedDate ||
      !timesForSelectedDate.length
    ) {
      return (
        <div className="text-gray-400 text-center mt-4">
          No available times for this date.
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-semibold text-white">
            {new Date(selectedDate).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <div className="ml-auto flex gap-1 bg-gray-800 rounded-lg p-1">
            <button
              className={`px-2 py-1 rounded ${
                timeFormat === "12h" ? "bg-black text-white" : "text-gray-300"
              }`}
              onClick={() => setTimeFormat("12h")}
              type="button"
            >
              12h
            </button>
            <button
              className={`px-2 py-1 rounded ${
                timeFormat === "24h" ? "bg-black text-white" : "text-gray-300"
              }`}
              onClick={() => setTimeFormat("24h")}
              type="button"
            >
              24h
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
          {timesForSelectedDate.map((slot: any) => {
            const time = new Date(slot.time); // slot.time is UTC ISO string
            const timeStr =
              timeFormat === "12h"
                ? time.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                : time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });
            // Convert UTC slot time to local datetime-local string
            function toLocalDatetimeString(date: Date) {
              const pad = (n: number) => n.toString().padStart(2, "0");
              return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
                date.getDate()
              )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            }
            return (
              <button
                key={slot.time}
                className="flex items-center gap-3 px-8 py-4 rounded-xl border border-gray-700 bg-gray-900 hover:bg-green-900 text-white text-lg font-bold transition-colors duration-150"
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
                <span className="h-3 w-3 rounded-full bg-green-400 inline-block" />
                {timeStr}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-10 bg-gray-900 border border-gray-700 rounded-3xl shadow-xl max-w-4xl w-full mx-auto flex flex-col items-center">
      <h2 className="text-2xl text-left font-bold mb-4 text-white">
        Get slots to book
      </h2>
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
        <div className="flex flex-row gap-16 w-full justify-center">
          <div>{renderCalendar()}</div>
          <div className="flex-1 min-w-[300px]">
            {loading ? (
              <div className="text-white text-center mt-8">Loading...</div>
            ) : (
              renderTimes()
            )}
          </div>
        </div>
      )}
      {eventData && !slots && (
        <div className="text-gray-500 text-center mt-4">
          No available slots found.
        </div>
      )}
    </div>
  );
}
