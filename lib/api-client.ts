// The one place that talks HTTP to the backend.
//
// NEXT_PUBLIC_API_BASE is the backend's origin (for example https://api.example.com). While it is
// empty there is no backend yet, and the functions in lib/auth-api.ts answer from an in-browser mock
// instead, so the screens can be built and tested before the API exists.
//
// Session model (MAC-BE, see docs/BE_INTEGRATION.md): the short-lived access token lives only in this
// module's memory and is sent as a Bearer header; the refresh token is an httpOnly cookie the backend
// owns. Never store the access token in localStorage.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

// The mock/real switch. NEXT_PUBLIC_IS_MOCK=false talks to the backend at API_BASE; anything else
// (including unset) keeps the in-browser mock, so a fresh checkout still runs with no server.
export const isMock = process.env.NEXT_PUBLIC_IS_MOCK !== "false";

// Version string of the terms / privacy documents the user agrees to (the backend checks it matches
// its own required version). TEMPORARY "v1" until the legal documents are finalized (docs/EH_TODO.md).
export const TERMS_VERSION = process.env.NEXT_PUBLIC_TERMS_VERSION ?? "v1";

// The backend's error body is { code, message } (see the API spec); `code` is what screens branch on.
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 0,
    public data?: unknown,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// Concurrent 401s must share one refresh: the backend rotates the refresh cookie, so two parallel
// refreshes would invalidate each other.
let refreshing: Promise<boolean> | null = null;

// Called on app start: the refresh cookie (if any) gives a new access token and the member.
// A rejected session (no/invalid cookie) is told apart from a network failure so that a server
// outage does not log the user out. Never throws.
export type RefreshResult<T> =
  | { ok: true; data: T }
  | { ok: false; offline: boolean };

export async function refreshSession<T>(): Promise<RefreshResult<T>> {
  if (!API_BASE) return { ok: false, offline: true };
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "X-Requested-With": "MAC" },
      credentials: "include",
    });
    if (!res.ok) {
      accessToken = null;
      return { ok: false, offline: res.status >= 500 };
    }
    const data = (await res.json()) as T & { accessToken?: string };
    accessToken = data.accessToken ?? null;
    return { ok: true, data };
  } catch {
    return { ok: false, offline: true };
  }
}

async function refreshAccessToken(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "X-Requested-With": "MAC" },
        credentials: "include",
      });
      if (!res.ok) {
        accessToken = null;
        return false;
      }
      const data = (await res.json()) as { accessToken?: string };
      accessToken = data.accessToken ?? null;
      return accessToken !== null;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T>(
  path: string,
  init: {
    method?: string;
    body?: unknown; // JSON-encoded, or sent as-is when it is a FormData (multipart)
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  if (!API_BASE)
    throw new ApiError(
      "API_BASE_MISSING",
      "서버 주소(NEXT_PUBLIC_API_BASE)가 설정되지 않았어요.",
    );
  const isAuth = path.startsWith("/auth/");
  // Public auth calls answer 401 for their own reasons (wrong password...), so a refresh cannot help;
  // everything else, including withdraw and social re-auth, may just have an expired access token.
  const retryable =
    !/^\/auth\/(refresh|login|signup|social$|email\/|password\/|logout)/.test(
      path,
    );
  const send = () => {
    const isForm = init.body instanceof FormData;
    const headers: Record<string, string> = { ...init.headers };
    // a multipart body gets its Content-Type (with the boundary) from the browser
    if (init.body !== undefined && !isForm)
      headers["Content-Type"] = "application/json";
    // the backend rejects auth POSTs without this header and an allowed Origin (CSRF defense)
    if (isAuth) headers["X-Requested-With"] = "MAC";
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(`${API_BASE}/api/v1${path}`, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers,
      body: isForm
        ? (init.body as FormData)
        : init.body === undefined
          ? undefined
          : JSON.stringify(init.body),
      credentials: "include",
    });
  };

  let res: Response;
  try {
    res = await send();
    // an expired access token: refresh once and retry (auth endpoints handle their own 401s)
    if (res.status === 401 && retryable && (await refreshAccessToken()))
      res = await send();
  } catch {
    throw new ApiError(
      "NETWORK",
      "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
    );
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const body = (data ?? {}) as { code?: string; message?: string };
    throw new ApiError(
      body.code ?? "UNKNOWN",
      body.message ?? "요청을 처리하지 못했어요.",
      res.status,
      data,
    );
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
