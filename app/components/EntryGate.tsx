"use client";

import { useState } from "react";

export default function EntryGate({
  onReady,
}: {
  onReady: (lat: number, lng: number) => void;
}) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [error, setError] = useState<string>("");

  function enter() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Your browser doesn't support location access.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => onReady(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setStatus("error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is required to place you on the map."
            : "Couldn't get your location. Please try again.",
        );
      },
      // High accuracy + maximumAge:0 forces a fresh fix (Wi-Fi/GPS scan)
      // instead of reusing the browser's cached IP-based location.
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center gap-10 overflow-hidden bg-[#050807] p-6 text-[#F2F1EB]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(2,170,176,0.10),transparent_60%)]" />

      <div className="relative flex flex-col items-center gap-6">
        <span
          aria-hidden="true"
          className="h-3 w-3 animate-pulse rounded-full bg-[#02AAB0] [animation-duration:2.4s]"
        />

        <div className="text-center">
          <h1 className="font-serif text-5xl tracking-tight">Pulse</h1>
          <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-[#8A9391]">
            A living globe of anonymous strangers. Drop onto the map and
            connect.
          </p>
        </div>
      </div>

      <button
        onClick={enter}
        disabled={status === "locating"}
        className="relative rounded-full bg-[#02AAB0] px-8 py-3 font-semibold text-[#04100F] transition hover:bg-[#03C4CB] disabled:bg-[#1C2422] disabled:text-[#5A6462]"
      >
        {status === "locating" ? "Finding your place…" : "Enter Pulse"}
      </button>

      {status === "error" && (
        <p className="max-w-sm text-center text-sm text-[#EC221F]">{error}</p>
      )}

      <p className="max-w-xs text-center text-xs leading-relaxed text-[#5A6462]">
        No sign-up. Your dot is placed 1–3&nbsp;km from your real location.
        Nothing is stored — closing the tab ends everything.
      </p>
    </div>
  );
}