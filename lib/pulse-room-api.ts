// Client-side helpers for the Live Pulse ephemeral room feature.

export interface PulseRoom {
  id: string;
  prompt: string;
  createdAt: string;
  expiresAt: string;
}

export interface PulseMessage {
  id: string;
  roomId: string;
  color: string;
  body: string;
  createdAt: string;
}

export async function checkForRoom(
  id: string,
  secret: string,
): Promise<PulseRoom | null> {
  const res = await fetch(
    `/api/pulse-room?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.room;
}

export async function joinRoom(
  sessionId: string,
  secret: string,
  roomId: string,
): Promise<string | null> {
  const res = await fetch("/api/pulse-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, secret, roomId }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.color ?? null;
}

export async function fetchRoomMessages(
  roomId: string,
): Promise<{ messages: PulseMessage[]; expiresAt: string } | null> {
  const res = await fetch(
    `/api/pulse-room/messages?roomId=${encodeURIComponent(roomId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return res.json();
}

export async function sendRoomMessage(
  sessionId: string,
  secret: string,
  roomId: string,
  body: string,
): Promise<boolean> {
  const res = await fetch("/api/pulse-room/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, secret, roomId, body }),
  });
  return res.ok;
}