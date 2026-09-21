"use client";

import { useEffect, useRef, useState } from "react";
import {
    checkForRoom,
    joinRoom,
    fetchRoomMessages,
    sendRoomMessage,
    type PulseRoom,
    type PulseMessage,
} from "@/lib/pulse-room-api";

const ROOM_POLL_INTERVAL_MS = 2_000;

const COLOR_HEX: Record<string, string> = {
    Blue: "#4A9EFF",
    Green: "#02AAB0",
    Purple: "#A855F7",
    Orange: "#F97316",
    Pink: "#EC4899",
    Yellow: "#EAB308",
    Teal: "#14B8A6",
    Red: "#EC221F",
};

function getRemainingMs(expiresAt: string): number {
    return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

function formatCountdown(remainingMs: number): string {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// The countdown shifts color as the room nears expiry, so its ephemerality
// is something you feel, not just read as text.
function countdownColor(remainingMs: number): string {
    if (remainingMs <= 60_000) return "#EC221F"; // last minute — red
    if (remainingMs <= 120_000) return "#EAB308"; // last two minutes — amber
    return "#8A9391"; // otherwise — neutral
}

export default function LivePulsePanel({
    sessionId,
    sessionSecret,
}: {
    sessionId: string;
    sessionSecret: string;
}) {
    const [room, setRoom] = useState<PulseRoom | null>(null);
    const [myColor, setMyColor] = useState<string | null>(null);
    const [messages, setMessages] = useState<PulseMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [remainingMs, setRemainingMs] = useState(0);
    const [open, setOpen] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let active = true;
        const tick = async () => {
            const found = await checkForRoom(sessionId, sessionSecret);
            if (active) setRoom(found);
        };
        tick();
        const timer = setInterval(tick, ROOM_POLL_INTERVAL_MS);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [sessionId, sessionSecret]);

    useEffect(() => {
        if (!room || !myColor) return;
        let active = true;

        const tick = async () => {
            const data = await fetchRoomMessages(room.id);
            if (active && data) setMessages(data.messages);
        };
        tick();
        const messageTimer = setInterval(tick, ROOM_POLL_INTERVAL_MS);

        const countdownTimer = setInterval(() => {
            setRemainingMs(getRemainingMs(room.expiresAt));
        }, 1000);
        setRemainingMs(getRemainingMs(room.expiresAt));

        return () => {
            active = false;
            clearInterval(messageTimer);
            clearInterval(countdownTimer);
        };
    }, [room, myColor]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!room) {
            setMyColor(null);
            setMessages([]);
            setOpen(false);
        }
    }, [room]);

    async function handleJoin() {
        if (!room) return;
        const color = await joinRoom(sessionId, sessionSecret, room.id);
        if (color) {
            setMyColor(color);
            setOpen(true);
        }
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!room || !draft.trim()) return;
        const text = draft.trim();
        setDraft("");
        await sendRoomMessage(sessionId, sessionSecret, room.id, text);
    }

    if (!room) return null;

    if (!myColor) {
        return (
            <button
                onClick={handleJoin}
                className="absolute left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#02AAB0] px-4 py-2.5 text-sm font-semibold text-[#04100F] shadow-lg transition hover:bg-[#03C4CB]"
            >
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#04100F]" />
                Live Pulse: join the conversation
            </button>
        );
    }

    const countdownText = formatCountdown(remainingMs);
    const countdownTint = countdownColor(remainingMs);

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="absolute left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0B0F0E] px-4 py-2.5 text-sm font-medium text-[#F2F1EB] shadow-lg"
            >
                <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLOR_HEX[myColor] ?? "#02AAB0" }}
                />
                Live Pulse open
                <span style={{ color: countdownTint }}>{countdownText} left</span>
            </button>
        );
    }

    return (
        <div className="absolute inset-x-0 top-0 z-20 flex justify-center p-4">
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#0B0F0E] shadow-2xl">
                <header className="flex items-center justify-between border-b border-[#1C2422] px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: COLOR_HEX[myColor] ?? "#02AAB0" }}
                        />
                        <p className="font-serif text-base text-[#F2F1EB]">Live Pulse</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className="text-xs font-semibold transition-colors"
                            style={{ color: countdownTint }}
                        >
                            {countdownText} left
                        </span>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-xs font-medium text-[#8A9391] hover:text-[#F2F1EB]"
                        >
                            Minimize
                        </button>
                    </div>
                </header>

                <div className="border-b border-[#1C2422] px-4 py-3">
                    <p className="text-sm leading-relaxed text-[#F2F1EB]">
                        {room.prompt}
                    </p>
                </div>

                <div className="flex max-h-80 flex-col gap-2 overflow-y-auto p-4">
                    {messages.length === 0 && (
                        <p className="text-center text-sm text-[#5A6462]">
                            No one's spoken up yet. Break the silence.
                        </p>
                    )}
                    {messages.map((m) => {
                        const isMine = m.color === myColor;
                        return (
                            <div
                                key={m.id}
                                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                                <div className="flex max-w-[80%] flex-col gap-0.5">
                                    {!isMine && (
                                        <span
                                            className="text-xs font-semibold"
                                            style={{ color: COLOR_HEX[m.color] ?? "#8A9391" }}
                                        >
                                            {m.color}
                                        </span>
                                    )}
                                    <span
                                        className="rounded-2xl px-3.5 py-2 text-sm leading-snug text-[#F2F1EB]"
                                        style={{
                                            backgroundColor: isMine
                                                ? COLOR_HEX[myColor] ?? "#02AAB0"
                                                : "#1C2422",
                                            color: isMine ? "#04100F" : "#F2F1EB",
                                        }}
                                    >
                                        {m.body}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={endRef} />
                </div>

                <form
                    onSubmit={handleSend}
                    className="flex gap-2 border-t border-[#1C2422] p-3"
                >
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Say something…"
                        maxLength={300}
                        className="flex-1 rounded-full bg-[#1C2422] px-4 py-2 text-sm text-[#F2F1EB] outline-none placeholder:text-[#5A6462] focus:ring-2 focus:ring-[#02AAB0]"
                    />
                    <button
                        type="submit"
                        disabled={!draft.trim()}
                        className="rounded-full bg-[#02AAB0] px-4 py-2 text-sm font-semibold text-[#04100F] disabled:bg-[#1C2422] disabled:text-[#5A6462]"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}