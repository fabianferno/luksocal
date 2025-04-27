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

  useEffect(() => {
    // Load web component here if needed
    promise?.then(() => {
      setMounted(true);
    });
  }, []);

  // Fetch profile data directly from Cal.com (example of direct browser-side approach)
  useEffect(() => {
    async function fetchDirectProfile() {
      try {
        // This will only work in a browser extension or when CORS is not an issue
        // For this app, we'll use our API proxy instead
        const username = "fabianferno";

        // Use our API endpoint instead of direct fetch to avoid CORS
        console.log(`Fetching profile data for ${username}...`);
        const response = await fetch(`/api/profile/${username}`);

        if (!response.ok) {
          console.error(`API error: ${response.status}`);
          const errorData = await response.json().catch(() => null);
          console.error("Error details:", errorData);
          return;
        }

        const data = await response.json();
        console.log("Profile data via API:", data);

        if (data) {
          setProfileData(data);
        } else {
          console.log("No profile data found for", username);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    }

    if (mounted) {
      fetchDirectProfile();
    }
  }, [mounted]);

  const { selectedAddress, setSelectedAddress, isSearching } = useUpProvider();

  if (!mounted) {
    return null; // or a loading placeholder
  }

  return (
    <>
      <div className={`${isSearching ? "hidden" : "block"}`}></div>

      {/* Display profile data if available */}
      {profileData && (
        <div className="p-4 border rounded-lg shadow mt-4">
          <h2 className="text-xl font-bold mb-2">{profileData.name}</h2>
          {profileData.image && (
            <img
              src={profileData.image}
              alt={profileData.name}
              className="w-20 h-20 rounded-full mb-2"
            />
          )}
          <p className="text-gray-600">{profileData.bio}</p>
        </div>
      )}
    </>
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
      <MainContent />
    </UpProvider>
  );
}
