"use client";

import { useState, useEffect } from "react";
import { useUpProvider } from "@/components/upProvider";
import { EventData } from "@/components/EventData";
import { BookEvent } from "@/components/BookEvent";
import { useSearchParams } from "next/navigation";
import { AppFooter } from "@/components/AppFooter";
export function MainContent() {
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
    setMounted(true);
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
          <h2 className="text-2xl font-bold mb-2 text-black">
            No profileId provided
          </h2>
          <p className="text-gray-700 text-center text-lg">
            Please provide a valid profileId in the URL.
          </p>
        </div>
      </main>
    );
  }
  if (!profileData && !loading) {
    return (
      <main className="flex flex-col items-center w-full min-h-screen pb-16 pt-4 md:pt-10">
        <div className="p-6 bg-white border border-gray-300 rounded-3xl shadow-xl mt-8 w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2 text-black">
            Profile not found
          </h2>
          <p className="text-gray-700 text-center text-lg">
            No data found for the provided profileId.
          </p>
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
              style={{ display: "block" }}
            />
          )}
          <div className="flex flex-col">
            <h2 className="text-2xl mb-2 text-black">
              Book a slot with{" "}
              <span className="font-bold">{profileData.name}</span>
            </h2>
            <div className="text-gray-700 text-lg">
              {String(profileData.bio).slice(0, 250) + "..."}
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
              setBookForm({ ...bookForm, startTime: "", _slotUtc: undefined });
              setStep(1);
            }}
          />
        )}
      </div>
      <AppFooter />
    </main>
  );
}
