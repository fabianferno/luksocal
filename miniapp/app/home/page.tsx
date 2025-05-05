"use client";

import React, { useState } from "react";
import Provider from "@/components/Provider";
import { CustomConnectButton } from "@/components/ConnectButton";
export default function LandingPage() {
  const [form, setForm] = useState({ username: "", cost15: "", cost30: "" });
  const [showModal, setShowModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `<lukso-cal username="${form.username}" cost15="${form.cost15}" cost30="${form.cost30}" />`;
    setGeneratedCode(code);
    setShowModal(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  return (
    <Provider>
      <div className="min-h-screen w-full bg-white font-serif relative flex flex-col">
        {/* Top Bar */}
        <header className="w-full flex items-center justify-between px-8 py-6 bg-transparent z-20">
          <CustomConnectButton />
          <div className="flex items-center gap-2">
            <svg width="36" height="36" fill="none" viewBox="0 0 36 36">
              <rect
                x="4"
                y="8"
                width="28"
                height="24"
                rx="4"
                fill="#fff"
                stroke="#EC4899"
                strokeWidth="2"
              />
              <rect
                x="4"
                y="8"
                width="28"
                height="6"
                fill="#EC4899"
                fillOpacity="0.2"
              />
              <rect x="10" y="2" width="4" height="8" rx="2" fill="#EC4899" />
              <rect x="22" y="2" width="4" height="8" rx="2" fill="#EC4899" />
            </svg>
            <span className="text-2xl font-bold text-gray-900 bg-white px-3 py-1 rounded-lg shadow">
              LuksoCal
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-4 md:px-12 py-8 md:py-0 z-10 relative gap-8 md:gap-24">
          {/* Left - Intro Text */}
          <section className="flex-1 flex flex-col justify-center w-full max-w-xl text-left md:pr-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Universal Calendar Booking
            </h1>
            <p className="text-lg md:text-2xl text-gray-700 mb-8 font-sans">
              Let people book calls within your universal profile.
              <br />
              Share your calendar link on the Universal Grid.
              <br />
              Set your own rates for 15 and 30 minute calls.
              <br />
              Simple, fast, and secure.
            </p>
          </section>

          {/* Right - Classy Form (shadcn/ui style) */}
          <section className="flex-1 flex flex-col justify-center w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-10 md:p-12 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-gray-800 font-semibold text-lg"
                >
                  Cal username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={handleChange}
                  className="w-full px-5 py-3 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 font-sans text-lg shadow-sm"
                  placeholder="yourname"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="cost15"
                  className="block text-gray-800 font-semibold text-lg"
                >
                  Cost for 15 min
                </label>
                <input
                  id="cost15"
                  name="cost15"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={form.cost15}
                  onChange={handleChange}
                  className="w-full px-5 py-3 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 font-sans text-lg shadow-sm"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="cost30"
                  className="block text-gray-800 font-semibold text-lg"
                >
                  Cost for 30 min
                </label>
                <input
                  id="cost30"
                  name="cost30"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={form.cost30}
                  onChange={handleChange}
                  className="w-full px-5 py-3 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 font-sans text-lg shadow-sm"
                  placeholder="e.g. 9"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-md bg-pink-600 hover:bg-pink-500 text-white font-bold text-lg shadow transition-colors font-sans border border-pink-700 mt-2"
              >
                Create your grid
              </button>
            </form>
          </section>
        </main>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-2xl p-10 shadow-2xl max-w-md w-full text-center border border-gray-200">
              <h2 className="text-3xl font-bold mb-6 text-black font-serif">
                Your Grid Code
              </h2>
              <p className="mb-6 text-gray-700 font-sans text-lg">
                Copy and paste this into your Universal Grid profile:
              </p>
              <div className="bg-gray-100 rounded-lg p-6 mb-6 text-left font-mono text-base text-gray-800 break-all select-all border border-gray-200">
                {generatedCode}
              </div>
              <button
                onClick={handleCopy}
                className="px-8 py-3 rounded bg-pink-600 hover:bg-pink-500 text-white font-semibold mb-4 border border-pink-700 font-sans text-lg"
              >
                Copy to clipboard
              </button>
              <br />
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-black text-base mt-2 font-sans"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Provider>
  );
}
