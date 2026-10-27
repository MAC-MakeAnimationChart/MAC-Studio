import { ApiError, api, hasBackend } from "./api-client";

// The account API as the screens use it. Each function is one backend endpoint (named in the
// comment above it); with no backend configured it answers from a small mock kept in localStorage,
// so the whole flow can be exercised today. When the API exists, set NEXT_PUBLIC_API_BASE and the
// real requests are used with no change to any screen.

export type Provider = "kakao" | "google" | "naver";

export type AuthUser = {
  id: string;
  email: string | null; // social accounts may not share an email (Kakao)
  displayName: string;
  plan: "studio" | "expert";
  identities: (Provider | "password")[];
  termsAgreed: boolean;
};

export type SocialLoginRequest = {
  provider: Provider;
  code: string; // the authorization code the provider gave back
  codeVerifier: string; // PKCE secret made in the browser (providers without PKCE ignore it)
  redirectUri: string; // must equal the one used to start the login
};

export type SocialLoginResponse = {
  user: AuthUser;
  isNewUser: boolean;
  needsTerms: boolean; // true until the user has accepted the terms
};

// What the browser keeps to show "logged in" (the real session is a cookie the backend owns).
export const userKey = (user: AuthUser) => user.email ?? `${user.id}`;

// POST /auth/social
export async function socialLogin(
  req: SocialLoginRequest,
): Promise<SocialLoginResponse> {
  if (hasBackend)
    return api<SocialLoginResponse>("/auth/social", { body: req });
  return mockSocialLogin(req);
}

// POST /me/terms  (records that the signed-in user accepted the terms and privacy policy)
export async function acceptTerms(): Promise<AuthUser> {
  if (hasBackend)
    return api<AuthUser>("/me/terms", { body: { accepted: true } });
  return mockAcceptTerms();
}

// ---------------------------------------------------------------------------------------------
// Mock backend (no server yet). Not secure and not meant to be: it only lets the screens run.
// The fake provider page (/auth/mock/[provider]) produces codes shaped "mock.<base64url json>".

const USERS_KEY = "mac-studio:mock:social-users";
const SESSION_KEY = "mac-studio:mock:session";

type MockProfile = { id: string; email: string | null; name: string };
type MockUsers = Record<
  string,
  { termsAt: string | null; profile: MockProfile }
>;

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

const toUser = (
  provider: Provider,
  profile: MockProfile,
  termsAt: string | null,
): AuthUser => ({
  id: `${provider}_${profile.id}`,
  email: profile.email,
  displayName: profile.name,
  plan: "studio",
  identities: [provider],
  termsAgreed: termsAt !== null,
});

async function mockSocialLogin(
  req: SocialLoginRequest,
): Promise<SocialLoginResponse> {
  await new Promise((r) => setTimeout(r, 400));
  const profile = decodeMockCode(req.code);
  if (!profile)
    throw new ApiError(
      "BACKEND_NOT_CONNECTED",
      "서버가 아직 연결되지 않아 실제 소셜 로그인은 할 수 없어요.",
      501,
    );
  const users = readUsers();
  const key = `${req.provider}:${profile.id}`;
  const isNewUser = !users[key];
  if (isNewUser) users[key] = { termsAt: null, profile };
  writeUsers(users);
  try {
    localStorage.setItem(SESSION_KEY, key);
  } catch {
    // ignore
  }
  return {
    user: toUser(req.provider, profile, users[key].termsAt),
    isNewUser,
    needsTerms: users[key].termsAt === null,
  };
}

async function mockAcceptTerms(): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 200));
  const key = localStorage.getItem(SESSION_KEY);
  const users = readUsers();
  if (!key || !users[key])
    throw new ApiError("UNAUTHORIZED", "로그인이 필요해요.", 401);
  users[key].termsAt = new Date().toISOString();
  writeUsers(users);
  const provider = key.split(":")[0] as Provider;
  return toUser(provider, users[key].profile, users[key].termsAt);
}
