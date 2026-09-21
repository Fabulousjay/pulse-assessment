"use client";

import { useEffect, useRef } from "react";

export default function VideoPanel({
  localStream,
  remoteStream,
  onEnd,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEnd: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localRef.current && localRef.current.srcObject !== localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteRef.current.srcObject !== remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#050807]">
      <div className="relative flex-1">
        {/* Remote (full screen) */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="h-full w-full bg-[#0B0F0E] object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#8A9391]">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#02AAB0] [animation-duration:2.4s]"
            />
            <p className="font-serif text-lg text-[#F2F1EB]">
              Waiting for stranger&rsquo;s video…
            </p>
          </div>
        )}
        {/* Local (picture-in-picture) */}
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 h-40 w-28 rounded-lg border-2 border-[#02AAB0] bg-[#0B0F0E] object-cover"
        />
      </div>
      <div className="flex justify-center bg-[#0B0F0E] p-4">
        <button
          onClick={onEnd}
          className="rounded-full bg-[#EC221F] px-8 py-3 font-semibold text-white transition hover:bg-[#FF3B37]"
        >
          End video
        </button>
      </div>
    </div>
  );
}