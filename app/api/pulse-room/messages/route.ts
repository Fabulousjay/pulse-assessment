import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_MESSAGE_LENGTH, MAX_MESSAGES_PER_ROOM } from "@/lib/pulse-room";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/pulse-room/messages?roomId= — returns all messages in a room,
// newest last. No auth needed beyond a valid, non-expired room, since
// messages carry only an anonymous color, never a sessionId.
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return Response.json({ error: "missing roomId" }, { status: 400 });
  }

  const room = await prisma.pulseRoom.findUnique({ where: { id: roomId } });
  if (!room || room.expiresAt < new Date()) {
    return Response.json({ error: "room expired" }, { status: 404 });
  }

  const messages = await prisma.pulseMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ messages, expiresAt: room.expiresAt });
}

// POST /api/pulse-room/messages — body { sessionId, secret, roomId, body }.
// Posts a message under the caller's assigned color for that room.
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { sessionId, secret, roomId, body } = (payload ?? {}) as Record<string, unknown>;

  if (
    typeof sessionId !== "string" ||
    typeof secret !== "string" ||
    typeof roomId !== "string" ||
    typeof body !== "string"
  ) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const text = body.trim();
  if (!text || text.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: "invalid message length" }, { status: 400 });
  }

  const caller = await prisma.presence.findUnique({
    where: { id: sessionId },
    select: { secret: true },
  });
  if (!caller || caller.secret !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const room = await prisma.pulseRoom.findUnique({ where: { id: roomId } });
  if (!room || room.expiresAt < new Date()) {
    return Response.json({ error: "room expired" }, { status: 404 });
  }

  const member = await prisma.pulseRoomMember.findUnique({
    where: { roomId_sessionId: { roomId, sessionId } },
  });
  if (!member) {
    return Response.json({ error: "not a member of this room" }, { status: 403 });
  }

  const messageCount = await prisma.pulseMessage.count({ where: { roomId } });
  if (messageCount >= MAX_MESSAGES_PER_ROOM) {
    return Response.json({ error: "room message limit reached" }, { status: 429 });
  }

  const message = await prisma.pulseMessage.create({
    data: { roomId, color: member.color, body: text },
  });

  return Response.json({ message });
}