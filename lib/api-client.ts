// The one place that talks HTTP to the backend.
//
// NEXT_PUBLIC_API_BASE is the backend's origin (for example https://api.example.com). While it is
// empty there is no backend yet, and the functions in lib/auth-api.ts answer from an in-browser mock
// instead, so the screens can be built and tested before the API exists.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
export const hasBackend = API_BASE !== "";

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

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1${path}`, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers:
        init.body === undefined
          ? undefined
          : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      // the session lives in an httpOnly cookie that only the backend can read or write
      credentials: "include",
    });
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
