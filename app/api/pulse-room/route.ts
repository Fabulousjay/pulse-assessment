import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  MIN_ONLINE_FOR_ROOM,
  ROOM_DURATION_MS,
  pickRandomPrompt,
  pickRandomColor,
} from "@/lib/pulse-room";
import { STALE_MS } from "@/lib/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/pulse-room?id=&secret= — checks if a live room currently exists
// (enough people online), returns it if so, or null if there aren't enough
// people online right now. Requires the caller's session secret, same as
// every other endpoint, to prove they're a real online participant.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  const secret = params.get("secret");

  if (!id || !secret) {
    return Response.json({ error: "missing id or secret" }, { status: 400 });
  }

  const caller = await prisma.presence.findUnique({
    where: { id },
    select: { secret: true },
  });
  if (!caller || caller.secret !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Clean up any expired room and its data first.
  const expired = await prisma.pulseRoom.findMany({
    where: { expiresAt: { lt: now } },
    select: { id: true },
  });
  for (const room of expired) {
    await prisma.pulseMessage.deleteMany({ where: { roomId: room.id } });
    await prisma.pulseRoomMember.deleteMany({ where: { roomId: room.id } });
    await prisma.pulseRoom.delete({ where: { id: room.id } });
  }

  const activeRoom = await prisma.pulseRoom.findFirst({
    where: { expiresAt: { gte: now } },
    orderBy: { createdAt: "desc" },
  });

  if (activeRoom) {
    return Response.json({ room: activeRoom });
  }

  // No active room. Only create one if enough people are genuinely online.
  const staleCutoff = new Date(Date.now() - STALE_MS);
  const onlineCount = await prisma.presence.count({
    where: { lastSeen: { gte: staleCutoff } },
  });

  if (onlineCount < MIN_ONLINE_FOR_ROOM) {
    return Response.json({ room: null });
  }

  const newRoom = await prisma.pulseRoom.create({
    data: {
      prompt: pickRandomPrompt(),
      expiresAt: new Date(Date.now() + ROOM_DURATION_MS),
    },
  });

  return Response.json({ room: newRoom });
}

// POST /api/pulse-room — body { sessionId, secret, roomId }. Joins a room,
// assigning a random anonymous color not already taken in that room.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { sessionId, secret, roomId } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof sessionId !== "string" ||
    typeof secret !== "string" ||
    typeof roomId !== "string"
  ) {
    return Response.json({ error: "invalid body" }, { status: 400 });
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

  const existing = await prisma.pulseRoomMember.findUnique({
    where: { roomId_sessionId: { roomId, sessionId } },
  });
  if (existing) {
    return Response.json({ color: existing.color });
  }

  const members = await prisma.pulseRoomMember.findMany({
    where: { roomId },
    select: { color: true },
  });
  const color = pickRandomColor(members.map((m) => m.color));
  if (!color) {
    return Response.json({ error: "room full" }, { status: 409 });
  }

  await prisma.pulseRoomMember.create({
    data: { roomId, sessionId, color },
  });

  return Response.json({ color });
}