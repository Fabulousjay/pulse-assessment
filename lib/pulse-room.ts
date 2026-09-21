// Live Pulse — a single ephemeral group room. All configuration for the
// feature lives here so client and server agree on the same numbers.

export const MIN_ONLINE_FOR_ROOM = 3; // room only exists with this many online
export const ROOM_DURATION_MS = 5 * 60 * 1000; // 5 minutes, then it's gone
export const MAX_MESSAGE_LENGTH = 300;
export const MAX_MESSAGES_PER_ROOM = 200; // hard cap, abuse guard

export const ROOM_COLORS = [
  "Blue",
  "Green",
  "Purple",
  "Orange",
  "Pink",
  "Yellow",
  "Teal",
  "Red",
] as const;

const GENERAL_PROMPTS = [
  "What's something you've been thinking about lately?",
  "You can teleport anywhere for one hour. Where do you go?",
  "What's something everyone should experience once?",
  "What's a small thing that made you smile recently?",
  "If today had a soundtrack, what's the first song?",
];

const MORNING_PROMPTS = [
  "What's the first thing on your mind this morning?",
  "Coffee, tea, or neither — and why does it matter so much?",
  "What are you hoping today actually looks like?",
];

const AFTERNOON_PROMPTS = [
  "What's kept you going so far today?",
  "Lunch: exciting or just fuel today?",
  "What's one thing you're glad you did this morning?",
];

const EVENING_PROMPTS = [
  "What are you having for dinner tonight?",
  "What's the best part of your day been so far?",
  "Winding down or just getting started for the night?",
];

const NIGHT_PROMPTS = [
  "Why are you still up?",
  "What's on your mind at this hour?",
  "Last thing you'll do before sleep tonight?",
];

// Server timezone won't match every visitor, so this is a light touch, not a
// precise personalization — it just keeps prompts feeling current rather
// than static, without needing the client's real local time.
function getPromptPoolForCurrentHour(): string[] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return MORNING_PROMPTS;
  if (hour >= 12 && hour < 17) return AFTERNOON_PROMPTS;
  if (hour >= 17 && hour < 21) return EVENING_PROMPTS;
  return NIGHT_PROMPTS;
}

export function pickRandomPrompt(): string {
  const pool = [...getPromptPoolForCurrentHour(), ...GENERAL_PROMPTS];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRandomColor(taken: string[]): string | null {
  const available = ROOM_COLORS.filter((c) => !taken.includes(c));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}