"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { PROVIDERS } from "@/lib/social-auth";
import type { Provider } from "@/lib/auth-api";

// A stand-in for the Kakao / Google / Naver login page, used while no real client ID is configured.
// It does what the real page ends with: send the browser back to the callback address with a
// `code` and the `state` it was given (or `error=access_denied` if the user cancels).
const toBase64Url = (text: string) =>
  btoa(unescape(encodeURIComponent(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const subscribeNever = () => () => {};

export function MockProvider({ provider }: { provider: Provider }) {
  const name = PROVIDERS.find((p) => p.id === provider)?.name ?? provider;
  const [email, setEmail] = useState(`demo-${provider}@example.com`);
  const [nick, setNick] = useState("데모 사용자");
  // the address bar is read through an external-store subscription (empty while prerendering)
  const search = useSyncExternalStore(
    subscribeNever,
    () => window.location.search,
    () => "",
  );
  const target = useMemo(() => {
    const q = new URLSearchParams(search);
    const redirect = q.get("redirect_uri") ?? "";
    const state = q.get("state") ?? "";
    // only ever go back to this site's own callback, never to an address from the URL
    return state &&
      redirect.startsWith(`${window.location.origin}/auth/callback/`)
      ? { redirect, state }
      : null;
  }, [search]);
  const invalid = search !== "" && target === null;

  const go = (params: Record<string, string>) => {
    if (!target) return;
    const url = new URL(target.redirect);
    for (const [k, v] of Object.entries({ ...params, state: target.state }))
      url.searchParams.set(k, v);
    window.location.assign(url.toString());
  };

  const approve = () => {
    const trimmed = email.trim();
    const profile = {
      id: toBase64Url(trimmed || nick),
      email: trimmed || null, // Kakao may not share an email: leave it empty to try that case
      name: nick.trim() || "이름 없음",
    };
    go({ code: `mock.${toBase64Url(JSON.stringify(profile))}` });
  };

  const field =
    "w-full rounded-lg border border-[color:var(--c-border-e4e7ee)] bg-[color:var(--c-bg-ffffff)] px-3 py-2.5 text-[13px] outline-none focus:border-[color:var(--c-border-4f7cf5)]";

  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6 py-10 text-[color:var(--c-text-0c1b4c)]">
      <div className="rounded-lg border border-dashed border-[color:var(--c-border-f97316)] bg-[color:var(--c-bg-ffffff)] p-7">
        <p
          role="note"
          className="rounded-md bg-[color:var(--c-bg-fff6f4)] px-3 py-2 text-[11px] leading-5 text-[color:var(--c-text-c2410c)]"
        >
          개발용 가짜 화면이에요. 실제 {name} 로그인이 아니고, 아래에 적은
          값으로 로그인한 것처럼 동작해요. (서버·로그인 키 연결 전에만 나와요)
        </p>
        <h1 className="mt-4 text-[18px] font-bold">{name} 로그인 (데모)</h1>
        {invalid ? (
          <p role="alert" className="mt-4 text-[13px] font-bold">
            잘못된 요청이에요.
          </p>
        ) : (
          <>
            <label className="mt-4 block text-[11px] font-bold text-[color:var(--c-text-99a1b1)]">
              이메일 (비우면 이메일 없는 계정)
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${field} mt-1.5`}
              />
            </label>
            <label className="mt-3 block text-[11px] font-bold text-[color:var(--c-text-99a1b1)]">
              이름
              <input
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                className={`${field} mt-1.5`}
              />
            </label>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => go({ error: "access_denied" })}
                className="rounded-lg border border-[color:var(--c-border-b9bfd3)] py-2.5 text-[13px] font-bold hover:bg-[color:var(--c-bg-fafafc)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={approve}
                disabled={!target}
                className="rounded-lg bg-[color:var(--c-bg-2f66f5)] py-2.5 text-[13px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)] disabled:opacity-60"
              >
                동의하고 계속
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
