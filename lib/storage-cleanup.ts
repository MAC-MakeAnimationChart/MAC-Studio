import { notifyStorage } from "./external-store";
import {
  ACCOUNTS_SEEN_KEY,
  SAVED_ANY_VERSION,
  SAVED_PREFIX,
  SOCIAL_PENDING_PREFIX,
  USER_KEY,
  USER_SEEN_KEY,
} from "./storage-keys";

// What this site keeps in the visitor's browser, and for how long. Reading and writing localStorage
// is synchronous, so data that nobody needs any more slows every page down; this keeps it in check.
//
//   half-finished social login   10 minutes   (it is single use; anything older is junk)
//   login marker                 30 days since the browser was last used, then logged out
//   an account's saved data      90 days since that account was last used, then deleted
//   old data formats             removed at once (lib/saved.ts only reads the current one)
//   theme, mock accounts         kept (tiny)
//
// Everything else lives in sessionStorage, which the browser clears when the tab closes.
// This is the DEMO behavior: when saving moves to a backend, drop the saved-data part.
const DAY = 24 * 60 * 60 * 1000;
export const RETENTION = {
  pendingLoginMs: 10 * 60 * 1000,
  loginDays: 30,
  accountDays: 90,
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

function readSeen(): Record<string, number> {
  try {
    const parsed = JSON.parse(read(ACCOUNTS_SEEN_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// An account was just used (logged in): its saved data and the login marker start counting again.
export function markSeen(email: string, now = Date.now()) {
  try {
    const seen = readSeen();
    seen[email] = now;
    localStorage.setItem(ACCOUNTS_SEEN_KEY, JSON.stringify(seen));
    localStorage.setItem(USER_SEEN_KEY, String(now));
  } catch {
    // storage blocked: nothing to track
  }
}

// Removes what has outlived its lifetime. Safe to run on every page load; returns what it removed.
export function sweepStorage(now = Date.now()): string[] {
  const removed: string[] = [];
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) =>
      localStorage.key(i),
    ).filter((k): k is string => !!k);
    const drop = (key: string) => {
      localStorage.removeItem(key);
      removed.push(key);
    };

    // 1. half-finished social logins
    for (const key of keys) {
      if (!key.startsWith(SOCIAL_PENDING_PREFIX)) continue;
      let createdAt = 0;
      try {
        createdAt =
          (JSON.parse(read(key) ?? "{}") as { createdAt?: number }).createdAt ??
          0;
      } catch {
        // unreadable: treated as expired
      }
      if (now - createdAt > RETENTION.pendingLoginMs) drop(key);
    }

    // 2. saved data in a format nothing reads any more
    for (const key of keys) {
      const m = SAVED_ANY_VERSION.exec(key);
      if (m && Number(m[1]) < 3) drop(key);
    }

    // 3. an abandoned login: logged in, but the browser has not been used for a long time
    const user = read(USER_KEY);
    if (user) {
      const lastUse = Number(read(USER_SEEN_KEY)) || 0;
      if (lastUse && now - lastUse > RETENTION.loginDays * DAY) {
        drop(USER_KEY);
        drop(USER_SEEN_KEY);
      } else if (!lastUse || now - lastUse > 60 * 60 * 1000) {
        // used again: count from now (written at most hourly)
        localStorage.setItem(USER_SEEN_KEY, String(now));
      }
    } else if (read(USER_SEEN_KEY) !== null) {
      drop(USER_SEEN_KEY);
    }

    // 4. saved data of accounts that have not been used for a long time
    const current = read(USER_KEY);
    const seen = readSeen();
    const before = JSON.stringify(seen);
    const withData = new Set<string>();
    for (const key of keys) {
      if (!key.startsWith(SAVED_PREFIX)) continue;
      const email = key.slice(SAVED_PREFIX.length);
      withData.add(email);
      if (email === current)
        seen[email] = now; // in use right now
      else if (seen[email] === undefined)
        seen[email] = now; // first time seen: the clock starts here, nothing is deleted yet
      else if (now - seen[email] > RETENTION.accountDays * DAY) {
        drop(key);
        withData.delete(email);
      }
    }
    for (const email of Object.keys(seen))
      if (!withData.has(email)) delete seen[email]; // no data left to track
    if (JSON.stringify(seen) !== before) {
      if (Object.keys(seen).length === 0)
        localStorage.removeItem(ACCOUNTS_SEEN_KEY);
      else localStorage.setItem(ACCOUNTS_SEEN_KEY, JSON.stringify(seen));
    }

    // 5. old workspace copy in this tab (sessionStorage)
    try {
      sessionStorage.removeItem("mac-studio:workspace:v1");
    } catch {
      // ignore
    }
  } catch {
    // storage blocked or full: nothing to clean
  }
  if (removed.length > 0) notifyStorage(); // screens re-read (e.g. logged out)
  return removed;
}
