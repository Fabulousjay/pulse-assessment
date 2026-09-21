import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/leave — body { id, secret }. Removes the presence row and any
// pending signals to/from this user. Requires the session secret so a
// stranger can't force-disconnect someone else by guessing their id.
// Called via navigator.sendBeacon on tab close, so the body may arrive as
// text — parse defensively.
export async function POST(request: NextRequest) {
  let id: string | undefined;
  let secret: string | undefined;
  try {
    const text = await request.text();
    const parsed = text ? JSON.parse(text) : undefined;
    id = parsed?.id;
    secret = parsed?.secret;
  } catch {
    id = undefined;
    secret = undefined;
  }

  if (typeof id !== "string" || !id || typeof secret !== "string" || !secret) {
    return Response.json({ error: "invalid id or secret" }, { status: 400 });
  }

  const caller = await prisma.presence.findUnique({
    where: { id },
    select: { secret: true },
  });
  if (!caller || caller.secret !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // Independent cleanup deletes — unchanged
  await prisma.signal.deleteMany({
    where: { OR: [{ toId: id }, { fromId: id }] },
  });
  await prisma.presence.deleteMany({ where: { id } });

  return Response.json({ ok: true });
}