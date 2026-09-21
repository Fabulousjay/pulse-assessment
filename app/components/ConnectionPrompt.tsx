"use client";

// Reusable centered prompt for "someone wants to connect" and
// "someone wants to start video".
export default function ConnectionPrompt({
  title,
  subtitle,
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
}: {
  title: string;
  subtitle?: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050807] p-6">
      <div className="w-full max-w-xs rounded-2xl bg-[#0B0F0E] p-6 text-center text-[#F2F1EB]">
        <span
          aria-hidden="true"
          className="mx-auto mb-4 block h-2.5 w-2.5 animate-pulse rounded-full bg-[#02AAB0] [animation-duration:2.4s]"
        />
        <h2 className="font-serif text-xl">{title}</h2>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-relaxed text-[#8A9391]">
            {subtitle}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 rounded-full bg-[#1C2422] px-4 py-2.5 text-sm font-medium text-[#F2F1EB] transition hover:bg-[#26302D]"
          >
            {declineLabel}
          </button>
          <button
            onClick={onAccept}
            className="flex-1 rounded-full bg-[#02AAB0] px-4 py-2.5 text-sm font-semibold text-[#04100F] transition hover:bg-[#03C4CB]"
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}