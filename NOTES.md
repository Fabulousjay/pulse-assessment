# Notes

## Phase 1 — Make it run

App wouldn't start at all at first. "Cannot find module '.prisma/client'" error, caused by npm silently blocking Prisma's install script. Fixed with `npx prisma generate`.

Chat messages only showed on the sender's side, never the receiver's. Sender tagged messages with `t: "msg"`, receiver only listened for `t: "chat"`. One word off, silently swallowed by an empty catch block. Fixed by matching the tag on both sides.

Stale dots stayed on the map after someone left, the exact bug the README used as its example. The poll endpoint's heartbeat had an empty filter (`where: {}`), so it refreshed everyone's "last seen" on every poll, not just the caller's. That meant the staleness cleanup could never actually catch anyone. Scoped the filter to the caller's own id.

The hardest one: my own dot on the map kept rendering in the wrong screen position, even though the underlying coordinates were provably correct. Spent hours checking container sizing, font load timing, and resize handling before finding the real cause: a CSS "breathing" animation on the marker used `transform: scale(...)`, and Mapbox positions markers with `transform: translate(...)` on that same element. The animation was silently overwriting Mapbox's positioning every frame. Fixed by moving the animation to a separate inner element instead of the one Mapbox owns directly. Brought in a second AI for a fresh look after going in circles too long, and that's what actually found it.

## Phase 2 — Make it good

Rebuilt the visual identity around what the app actually is: anonymous, ephemeral, nighttime. Near black background, one teal accent reserved for anything "live," a serif for a few emotional moments (entry screen), clean sans everywhere else. Your own dot breathes slowly, tying back to the app's name. Every stranger's dot is a plain hollow ring, so there's a structural difference, not just a color to remember.

First pass leaned too hard on translucent backgrounds, which made buttons like Video nearly invisible. Redid it with solid colors and real contrast.

## Phase 3 — Make it secure

Found that every API route trusted a user's public session id as if it were also a password. Since that id is shown to every other online user (needed for the map), anyone could poll as another user and steal their pending messages, force them offline, or spoof a fake disconnect signal into their active chat.

Fixed by having the server generate a private secret on join, returned once to the owner. `poll`, `leave`, and `signal` now all require the matching secret, not just the id. Tested directly: hitting `poll` with a real id but wrong secret returns 401.

Not fixed: no rate limiting yet on the signal endpoint, so it's still possible to spam it faster than the message TTL clears. Flagging rather than hiding it.

## Phase 4 — Make it better

Built Live Pulse: a temporary group room that appears once 3+ people are online. Solves the cold start problem the 1-on-1 flow has, where you tap a dot and then just wait in silence.

Anonymous per-room color identity, fully separate from map identity. Shared icebreaker prompt on open, loosely time-of-day aware. Hard 5 minute expiry enforced server side, not just a countdown, room and messages both get deleted for real. Kept the ephemerality strict on purpose, since a permanent room would have quietly broken the app's actual thesis.

Messages store only the sender's color, never their session id, so even the raw database can't tie a room message back to a specific map identity.

Tested with 3 real browser sessions locally, then with a real second person over the actual internet on the deployed version. Room forms, prompt shows, messages post under the right colors, room genuinely disappears at expiry.

## Assumptions / trade-offs

- `?lat=&lng=` URL override left in for easier testing without needing two physical devices. Not gated behind anything, since it doesn't touch anything the security fixes in Phase 3 protect.
- WebRTC connections rely on STUN only, no TURN server, as the README states. Verified this fails reliably on carrier-grade NAT (mobile hotspot), works on normal WiFi.