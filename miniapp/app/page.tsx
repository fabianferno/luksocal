"use client";

import { Suspense } from "react";
import { UpProvider } from "@/components/upProvider";
import { MainContent } from "@/components/MainContent";

export default function Home() {
  return (
    <UpProvider>
      <div className="min-h-screen flex flex-col items-center">
        <Suspense fallback={<div>Loading...</div>}>
          <MainContent />
        </Suspense>
      </div>
    </UpProvider>
  );
}
