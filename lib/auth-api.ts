import {
  ApiError,
  TERMS_VERSION,
  api,
  isMock,
  refreshSession,
  setAccessToken,
} from "./api-client";

// The account API as the screens use it, following the MAC-BE contract (docs/BE_INTEGRATION.md).
// Each function is one backend call; with isMock (NEXT_PUBLIC_IS_MOCK is not "false") it answers from a
// small mock kept in the browser instead, so the whole flow can be exercised without a server.

export type Provider = "kakao" | "google" | "naver";

// The backend's MemberResponse. `email` is null for social accounts that did not share one.
export type AuthUser = {
  id: string;
  email: string | null;
  hasPassword: boolean;
  providers: string[]; // GOOGLE / KAKAO / NAVER
};

type AuthResponse = { accessToken: string; member: AuthUser };

// What the browser keeps to show "logged in" (the real session is the backend's refresh cookie).
export const userKey = (user: AuthUser) => user.email ?? `${user.id}`;

const agreedTerms = [
  { type: "TERMS", version: TERMS_VERSION },
  { type: "PRIVACY", version: TERMS_VERSION },
];

// Keeps the access token (memory only) and hands back the member.
const accept = (res: AuthResponse): AuthUser => {
  setAccessToken(res.accessToken);
  return res.member;
};

// ---- session -------------------------------------------------------------------------------------

export type RestoreResult =
  | { kind: "user"; user: AuthUser }
  | { kind: "none" } // no valid session: show as logged out
  | { kind: "offline" }; // server unreachable: keep whatever the screen already shows

// POST /auth/refresh — on app start.
export async function restoreSession(): Promise<RestoreResult> {
  if (isMock) return { kind: "offline" }; // the mock keeps its own "logged in" mark (lib/auth.ts)
  const r = await refreshSession<AuthResponse>();
  if (r.ok) return { kind: "user", user: r.data.member };
  return r.offline ? { kind: "offline" } : { kind: "none" };
}

// POST /auth/logout
export async function logoutApi(): Promise<void> {
  setAccessToken(null);
  if (isMock) return;
  try {
    await api<null>("/auth/logout", { method: "POST" });
  } catch {
    // the local state is already cleared; an unreachable server must not block logging out
  }
}

// ---- email ---------------------------------------------------------------------------------------

// POST /auth/login
export async function emailLogin(
  email: string,
  password: string,
): Promise<AuthUser> {
  if (isMock) return mockMember(email);
  return accept(
    await api<AuthResponse>("/auth/login", { body: { email, password } }),
  );
}

// POST /auth/signup (signupType EMAIL) — `verificationToken` comes from verifying the emailed code.
export async function emailSignup(
  email: string,
  password: string,
  verificationToken: string,
): Promise<AuthUser> {
  if (isMock) return mockMember(email);
  return accept(
    await api<AuthResponse>("/auth/signup", {
      body: {
        signupType: "EMAIL",
        email,
        password,
        verificationToken,
        agreedTerms,
      },
    }),
  );
}

export type CodeSent = {
  challengeId: string;
  expiresIn: number; // seconds
  resendAfter: number; // seconds
};

// The mock accepts this code for the password reset flow (sign-up has its own mock, see
// lib/email-verification.ts).
export const MOCK_RESET_CODE = "123456";

// POST /auth/email/send-code
export async function sendEmailCode(
  email: string,
  purpose: "signup" | "password_reset",
): Promise<CodeSent> {
  if (isMock) return { challengeId: "mock", expiresIn: 300, resendAfter: 30 };
  return api<CodeSent>("/auth/email/send-code", { body: { email, purpose } });
}

// POST /auth/email/verify
export async function verifyEmailCode(
  challengeId: string,
  code: string,
): Promise<{ verificationToken: string; expiresIn: number }> {
  if (isMock) {
    if (code !== MOCK_RESET_CODE)
      throw new ApiError(
        "INVALID_VERIFICATION",
        "인증 코드가 올바르지 않아요.",
        400,
      );
    return { verificationToken: "mock", expiresIn: 600 };
  }
  return api("/auth/email/verify", { body: { challengeId, code } });
}

// POST /auth/password/reset — 204; the user is NOT signed in afterwards and logs in with the new password.
export async function resetPassword(
  email: string,
  verificationToken: string,
  newPassword: string,
): Promise<void> {
  if (isMock) return;
  await api<null>("/auth/password/reset", {
    body: { email, verificationToken, newPassword },
  });
}

// ---- account -------------------------------------------------------------------------------------

// GET /me — null in mock mode (the mock keeps no account details).
export async function getMe(): Promise<AuthUser | null> {
  if (isMock) return null;
  return api<AuthUser>("/me");
}

// POST /auth/withdraw — 204. Email accounts send their password; social accounts must have passed
// socialReauth() within the last few minutes (the backend reads that from a cookie).
export async function withdraw(password?: string): Promise<void> {
  if (!isMock)
    await api<null>("/auth/withdraw", {
      body: { acknowledgeEmailReuseBlocked: true, ...(password ? { password } : {}) },
    });
  setAccessToken(null);
}

// ---- social --------------------------------------------------------------------------------------

export type SocialLoginRequest = {
  provider: Provider;
  code: string; // the authorization code the provider gave back
  codeVerifier: string; // PKCE secret made in the browser (Naver has none and sends `state` instead)
  state: string; // the state this browser made and already checked (the backend needs it for Naver)
  redirectUri: string; // must equal the one used to start the login
};

export type SocialLoginResult =
  | { kind: "login"; user: AuthUser } // existing account: signed in (200)
  | { kind: "signup"; provider: string; email: string | null }; // new identity: terms next (202)

// Naver has no PKCE and needs the already-checked `state`; the others send the PKCE verifier.
const socialBody = (req: SocialLoginRequest) =>
  req.provider === "naver"
    ? {
        provider: req.provider,
        code: req.code,
        redirectUri: req.redirectUri,
        state: req.state,
      }
    : {
        provider: req.provider,
        code: req.code,
        codeVerifier: req.codeVerifier,
        redirectUri: req.redirectUri,
      };

// POST /auth/social/reauth — proves, right before a withdrawal, that this is still the same social
// account (204; the backend then sets a short-lived cookie that /auth/withdraw consumes).
export async function socialReauth(req: SocialLoginRequest): Promise<void> {
  if (isMock) return;
  await api<null>("/auth/social/reauth", { body: socialBody(req) });
}

// POST /auth/social
export async function socialLogin(
  req: SocialLoginRequest,
): Promise<SocialLoginResult> {
  if (isMock) return mockSocialLogin(req);
  const res = await api<
    AuthResponse | { signupRequired: true; provider: string; email: string | null }
  >("/auth/social", { body: socialBody(req) });
  if ("signupRequired" in res)
    return { kind: "signup", provider: res.provider, email: res.email };
  return { kind: "login", user: accept(res) };
}

// POST /auth/signup (signupType SOCIAL) — finishes a social sign-up after the terms are accepted.
// The backend finds the pending identity through the short-lived mac_social_signup cookie.
export async function socialSignup(): Promise<AuthUser> {
  if (isMock) return mockSocialSignup();
  return accept(
    await api<AuthResponse>("/auth/signup", {
      body: { signupType: "SOCIAL", agreedTerms },
    }),
  );
}

// ---------------------------------------------------------------------------------------------
// Mock backend (isMock). Not secure and not meant to be: it only lets the screens run.
// The fake provider page (/auth/mock/[provider]) produces codes shaped "mock.<base64url json>".

const USERS_KEY = "mac-studio:mock:social-users";
const PENDING_KEY = "mac-studio:mock:social-pending"; // sessionStorage

type MockProfile = { id: string; email: string | null; name: string };
type MockUsers = Record<string, { profile: MockProfile }>;

const readUsers = (): MockUsers => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}") as MockUsers;
  } catch {
    return {};
  }
};
const writeUsers = (users: MockUsers) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // storage blocked: the mock just forgets the user
  }
};

const decodeMockCode = (code: string): MockProfile | null => {
  if (!code.startsWith("mock.")) return null;
  try {
    const b64 = code.slice(5).replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b64)))) as MockProfile;
  } catch {
    return null;
  }
};

const mockMember = (email: string): AuthUser => ({
  id: `mock_${email}`,
  email,
  hasPassword: true,
  providers: [],
});

const socialMember = (provider: Provider, profile: MockProfile): AuthUser => ({
  id: `${provider}_${profile.id}`,
  email: profile.email,
  hasPassword: false,
  providers: [provider.toUpperCase()],
});

async function mockSocialLogin(
  req: SocialLoginRequest,
): Promise<SocialLoginResult> {
  await new Promise((r) => setTimeout(r, 400));
  const profile = decodeMockCode(req.code);
  if (!profile)
    throw new ApiError(
      "BACKEND_NOT_CONNECTED",
      "서버가 아직 연결되지 않아 실제 소셜 로그인은 할 수 없어요.",
      501,
    );
  const key = `${req.provider}:${profile.id}`;
  if (readUsers()[key])
    return { kind: "login", user: socialMember(req.provider, profile) };
  try {
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ provider: req.provider, profile }),
    );
  } catch {
    // ignore: the sign-up step will report that it expired
  }
  return {
    kind: "signup",
    provider: req.provider.toUpperCase(),
    email: profile.email,
  };
}

async function mockSocialSignup(): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 200));
  let pending: { provider: Provider; profile: MockProfile } | null = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null");
  } catch {
    // fall through
  }
  if (!pending)
    throw new ApiError(
      "SOCIAL_SIGNUP_EXPIRED",
      "가입 시간이 지났어요. 처음부터 다시 시도해 주세요.",
      400,
    );
  const users = readUsers();
  users[`${pending.provider}:${pending.profile.id}`] = {
    profile: pending.profile,
  };
  writeUsers(users);
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
  return socialMember(pending.provider, pending.profile);
}
