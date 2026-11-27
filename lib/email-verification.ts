// Email verification for sign-up: send a 6-digit code, then check what the user typed.
//
// Two modes (lib/api-client.ts `isMock`):
//  - real: the backend emails the code (POST /auth/email/send-code) and checks it
//    (POST /auth/email/verify). The challenge id and the resulting proof token live only in this
//    module's memory; takeVerificationToken() hands the proof to POST /auth/signup once.
//  - mock: DEMO ONLY. No email is sent: the code is made in the browser and handed back as `devCode`
//    for the UI to show. NOT secure.
// The sign-up form only talks to the functions below.

import { ApiError, isMock } from "./api-client";
import { sendEmailCode, verifyEmailCode } from "./auth-api";

export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 5 * 60 * 1000; // mock: a code is valid for 5 minutes
export const RESEND_AFTER_MS = 30 * 1000; // mock: "send again" unlocks after 30 seconds
export const MAX_ATTEMPTS = 5; // mock: wrong tries before the code is burned

// real mode state (memory only, never persisted)
let challenge: { email: string; id: string } | null = null;
let proof: { email: string; token: string } | null = null;

const KEY = "mac-studio:email-verification";

type Pending = {
  email: string;
  code: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
};

function read(): Pending | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    return null;
  }
}

function write(p: Pending | null) {
  try {
    if (p) sessionStorage.setItem(KEY, JSON.stringify(p));
    else sessionStorage.removeItem(KEY);
  } catch {
    // storage blocked: verification can't be remembered, so sending will report an error below
  }
}

const randomCode = () => {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(n[0] % 10 ** CODE_LENGTH).padStart(CODE_LENGTH, "0");
};

export type SendResult =
  | {
      ok: true;
      expiresAt: number;
      sentAt: number;
      resendAfterMs: number;
      devCode: string; // empty with a real backend
    }
  | { ok: false; error: string; retryInMs?: number };

const messageOf = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

export async function sendVerificationCode(email: string): Promise<SendResult> {
  const now = Date.now();
  if (!isMock) {
    try {
      const r = await sendEmailCode(email, "signup");
      challenge = { email, id: r.challengeId };
      proof = null;
      return {
        ok: true,
        expiresAt: now + r.expiresIn * 1000,
        sentAt: now,
        resendAfterMs: r.resendAfter * 1000,
        devCode: "",
      };
    } catch (e) {
      return {
        ok: false,
        error: messageOf(e, "인증코드를 보내지 못했어요."),
      };
    }
  }
  const current = read();
  if (
    current &&
    current.email === email &&
    now - current.sentAt < RESEND_AFTER_MS
  ) {
    const retryInMs = RESEND_AFTER_MS - (now - current.sentAt);
    return {
      ok: false,
      error: `잠시 후에 다시 보낼 수 있어요. (${Math.ceil(retryInMs / 1000)}초)`,
      retryInMs,
    };
  }
  const next: Pending = {
    email,
    code: randomCode(),
    expiresAt: now + CODE_TTL_MS,
    sentAt: now,
    attempts: 0,
  };
  write(next);
  if (!read())
    return {
      ok: false,
      error: "브라우저 저장소를 쓸 수 없어 인증코드를 만들지 못했어요.",
    };
  return {
    ok: true,
    expiresAt: next.expiresAt,
    sentAt: next.sentAt,
    resendAfterMs: RESEND_AFTER_MS,
    devCode: next.code,
  };
}

export type VerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason: "none" | "expired" | "locked" | "wrong";
      error: string;
      attemptsLeft?: number;
    };

export async function verifyCode(
  email: string,
  input: string,
): Promise<VerifyResult> {
  if (!isMock) {
    if (!challenge || challenge.email !== email)
      return {
        ok: false,
        reason: "none",
        error: "인증코드를 먼저 받아 주세요.",
      };
    try {
      const r = await verifyEmailCode(challenge.id, input.trim());
      proof = { email, token: r.verificationToken };
      return { ok: true };
    } catch (e) {
      // a wrong code keeps the same challenge so the user can retype; anything else needs a new code
      const wrong = e instanceof ApiError && e.code === "INVALID_VERIFICATION";
      return {
        ok: false,
        reason: wrong ? "wrong" : "locked",
        error: messageOf(e, "인증하지 못했어요. 새 코드를 받아 주세요."),
      };
    }
  }
  const p = read();
  if (!p || p.email !== email)
    return { ok: false, reason: "none", error: "인증코드를 먼저 받아 주세요." };
  if (Date.now() > p.expiresAt) {
    write(null);
    return {
      ok: false,
      reason: "expired",
      error: "인증코드가 만료됐어요. 새 코드를 받아 주세요.",
    };
  }
  if (p.attempts >= MAX_ATTEMPTS) {
    write(null);
    return {
      ok: false,
      reason: "locked",
      error: "너무 많이 틀렸어요. 새 코드를 받아 주세요.",
    };
  }
  if (input.trim() !== p.code) {
    const attempts = p.attempts + 1;
    const attemptsLeft = MAX_ATTEMPTS - attempts;
    if (attemptsLeft <= 0) {
      write(null);
      return {
        ok: false,
        reason: "locked",
        error: "5번 틀려서 코드를 폐기했어요. 새 코드를 받아 주세요.",
      };
    }
    write({ ...p, attempts });
    return {
      ok: false,
      reason: "wrong",
      error: `코드가 맞지 않아요. (${attemptsLeft}번 남았어요)`,
      attemptsLeft,
    };
  }
  write(null);
  return { ok: true };
}

// The proof of a verified email, for POST /auth/signup. Usable once (the backend consumes it too).
export function takeVerificationToken(email: string): string {
  if (isMock) return "mock";
  const token = proof && proof.email === email ? proof.token : "";
  proof = null;
  return token;
}

export function clearVerification() {
  write(null);
  challenge = null;
  proof = null;
}
