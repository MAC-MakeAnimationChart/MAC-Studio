import type { AuthUser, Provider } from "./auth-api";
import { SOCIAL_PENDING_PREFIX } from "./storage-keys";

// Browser side of "log in with Kakao / Google / Naver" (OAuth 2.0 authorization code + PKCE).
//
//   1. startSocialLogin() opens a popup on the provider's login page (with `state` and a PKCE challenge)
//   2. the provider sends the popup back to /auth/callback/<provider>?code=...&state=...
//   3. that page (components/social-callback.tsx) hands the code to the backend (POST /auth/social)
//      and tells this window the result with postMessage
//
// The browser never sees a client secret or a provider token; the backend does the exchange with the
// provider and owns the session. Only public client IDs live here:
//   NEXT_PUBLIC_GOOGLE_CLIENT_ID, NEXT_PUBLIC_KAKAO_CLIENT_ID (REST API key), NEXT_PUBLIC_NAVER_CLIENT_ID
// With no client ID the flow goes through a fake provider page (/auth/mock/<provider>) instead.

export type ProviderInfo = { id: Provider; name: string };

export const PROVIDERS: ProviderInfo[] = [
  { id: "kakao", name: "카카오" },
  { id: "google", name: "구글" },
  { id: "naver", name: "네이버" },
];

const CLIENT_IDS: Record<Provider, string | undefined> = {
  google: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  kakao: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
  naver: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
};

export const isProvider = (value: string): value is Provider =>
  PROVIDERS.some((p) => p.id === value);

export const callbackUri = (provider: Provider) =>
  `${window.location.origin}/auth/callback/${provider}`;

// ---- what is remembered between "go to the provider" and "come back" ------------------------

export type Pending = {
  state: string;
  provider: Provider;
  verifier: string;
  redirectUri: string;
  returnTo: string; // where to go afterwards when no popup was used
  createdAt: number;
};

const PENDING_TTL_MS = 10 * 60 * 1000;
const pendingKey = (state: string) => `${SOCIAL_PENDING_PREFIX}${state}`;

// localStorage (not sessionStorage) so the popup, a separate window, can read what this window saved.
function savePending(p: Pending) {
  try {
    localStorage.setItem(pendingKey(p.state), JSON.stringify(p));
  } catch {
    // blocked storage: the callback will report an expired request
  }
}

// Reads and removes: a login attempt can be completed only once.
export function takePending(state: string | null): Pending | null {
  if (!state) return null;
  try {
    const raw = localStorage.getItem(pendingKey(state));
    localStorage.removeItem(pendingKey(state));
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending;
    return Date.now() - p.createdAt <= PENDING_TTL_MS ? p : null;
  } catch {
    return null;
  }
}

// ---- PKCE ------------------------------------------------------------------------------------

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const randomString = (bytes: number) =>
  base64Url(crypto.getRandomValues(new Uint8Array(bytes)));

async function challengeFor(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64Url(new Uint8Array(digest));
}

// ---- provider login pages ------------------------------------------------------------------

function authorizeUrl(
  provider: Provider,
  p: { state: string; challenge: string; redirectUri: string },
) {
  const clientId = CLIENT_IDS[provider];
  if (!clientId) {
    // no real provider configured: a stand-in page that behaves like one
    const q = new URLSearchParams({
      state: p.state,
      redirect_uri: p.redirectUri,
    });
    return `${window.location.origin}/auth/mock/${provider}?${q}`;
  }
  const common = {
    client_id: clientId,
    redirect_uri: p.redirectUri,
    response_type: "code",
    state: p.state,
  };
  const pkce = { code_challenge: p.challenge, code_challenge_method: "S256" };
  if (provider === "google")
    return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      ...common,
      ...pkce,
      scope: "openid email profile",
      prompt: "select_account",
    })}`;
  if (provider === "kakao")
    // the consent items (nickname, email) are set in the Kakao developer console
    return `https://kauth.kakao.com/oauth/authorize?${new URLSearchParams({ ...common, ...pkce })}`;
  // Naver has no PKCE; `state` is its only forgery protection
  return `https://nid.naver.com/oauth2.0/authorize?${new URLSearchParams(common)}`;
}

// ---- starting a login ------------------------------------------------------------------------

export type SocialOutcome =
  | { ok: true; user: AuthUser; isNewUser: boolean }
  | { ok: false; code: string; message: string };

export const SOCIAL_MESSAGE = "mac-social-result";
export type SocialMessage = {
  type: typeof SOCIAL_MESSAGE;
  state: string;
  outcome: SocialOutcome;
};

const POPUP = { width: 480, height: 680 };

// Opens the provider login in a popup and resolves with the result (null if the popup was closed
// without finishing). If popups are blocked it falls back to leaving the page, and the callback
// page then brings the user back to `returnTo`; in that case this promise never settles.
export async function startSocialLogin(
  provider: Provider,
  returnTo: string,
): Promise<SocialOutcome | null> {
  // open the window right now, inside the click, so popup blockers allow it
  const left = window.screenX + (window.outerWidth - POPUP.width) / 2;
  const top = window.screenY + (window.outerHeight - POPUP.height) / 2;
  const popup = window.open(
    "",
    "mac-social-login",
    `width=${POPUP.width},height=${POPUP.height},left=${left},top=${top}`,
  );

  const state = randomString(24);
  const verifier = randomString(48);
  const redirectUri = callbackUri(provider);
  const url = authorizeUrl(provider, {
    state,
    challenge: await challengeFor(verifier),
    redirectUri,
  });
  savePending({
    state,
    provider,
    verifier,
    redirectUri,
    returnTo,
    createdAt: Date.now(),
  });

  if (!popup) {
    window.location.assign(url);
    return new Promise(() => {});
  }
  popup.location.href = url;

  return new Promise<SocialOutcome | null>((resolve) => {
    let settled = false;
    const finish = (outcome: SocialOutcome | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      clearInterval(timer);
      resolve(outcome);
    };
    const onMessage = (e: MessageEvent<SocialMessage>) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== SOCIAL_MESSAGE || e.data.state !== state) return;
      finish(e.data.outcome);
    };
    window.addEventListener("message", onMessage);
    // closed by the user before finishing (a short grace lets a late message arrive first)
    const timer = setInterval(() => {
      if (popup.closed) setTimeout(() => finish(null), 400);
    }, 500);
  });
}
