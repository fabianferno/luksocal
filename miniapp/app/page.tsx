"use client";

import { UpProvider } from "@/components/upProvider";
import { MainContent } from "@/components/MainContent";
import { AppFooter } from "@/components/AppFooter";

export default function Home() {
  return (
    <UpProvider>
      <div className="min-h-screen flex flex-col items-center">
        <MainContent />
      </div>
    </UpProvider>
  );
}
