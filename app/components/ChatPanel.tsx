"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: number;
  mine: boolean;
  text: string;
}

export default function ChatPanel({
  messages,
  connected,
  videoBusy,
  onSend,
  onStartVideo,
  onEnd,
}: {
  messages: ChatMessage[];
  connected: boolean;
  videoBusy: boolean;
  onSend: (text: string) => void;
  onStartVideo: () => void;
  onEnd: () => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !connected) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col bg-[#0B0F0E] text-[#F2F1EB] shadow-2xl">
      <header className="flex items-center justify-between border-b border-[#1C2422] px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              connected
                ? "animate-pulse bg-[#02AAB0] [animation-duration:2.4s]"
                : "bg-[#3A4442]"
            }`}
          />
          <div>
            <p className="font-serif text-lg leading-tight">Stranger</p>
            <p className="text-xs font-medium text-[#8A9391]">
              {connected ? "Connected" : "Connecting…"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onStartVideo}
            disabled={!connected || videoBusy}
            className="rounded-full bg-[#02AAB0] px-4 py-2 text-sm font-semibold text-[#04100F] transition hover:bg-[#03C4CB] disabled:bg-[#1C2422] disabled:text-[#5A6462]"
          >
            Video
          </button>
          <button
            onClick={onEnd}
            className="rounded-full bg-[#EC221F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#FF3B37]"
          >
            End
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm leading-relaxed text-[#5A6462]">
            Say hello. Messages are peer-to-peer and never stored.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
          >
            <span
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${
                m.mine
                  ? "bg-[#02AAB0] text-[#04100F] font-medium"
                  : "bg-[#1C2422] text-[#F2F1EB]"
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex gap-2 border-t border-[#1C2422] p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={connected ? "Type a message…" : "Connecting…"}
          disabled={!connected}
          className="flex-1 rounded-full bg-[#1C2422] px-4 py-2.5 text-[15px] text-[#F2F1EB] outline-none placeholder:text-[#5A6462] focus:ring-2 focus:ring-[#02AAB0] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!connected || !draft.trim()}
          className="rounded-full bg-[#02AAB0] px-5 py-2.5 text-sm font-semibold text-[#04100F] transition hover:bg-[#03C4CB] disabled:bg-[#1C2422] disabled:text-[#5A6462]"
        >
          Send
        </button>
      </form>
    </div>
  );
}