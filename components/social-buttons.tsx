"use client";

import { useState, type ReactNode } from "react";
import { login } from "@/lib/auth";
import { userKey, type Provider } from "@/lib/auth-api";
import { PROVIDERS, startSocialLogin } from "@/lib/social-auth";

// Brand colors follow each provider's login-button guidelines, so they do not change in dark mode.
const LOOK: Record<Provider, { cls: string; icon: ReactNode }> = {
  kakao: {
    cls: "bg-[#FEE500] text-[#191919] hover:brightness-95",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
        <path
          fill="#191919"
          d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.66 6.77l-.95 3.5c-.08.3.26.54.52.37l4.2-2.8c.52.06 1.04.1 1.57.1 5.52 0 10-3.58 10-8S17.52 3 12 3z"
        />
      </svg>
    ),
  },
  google: {
    cls: "border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa]",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.06-3.74 1.06-2.87 0-5.3-1.94-6.17-4.55H2.18v2.84A11 11 0 0 0 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.83 13.09a6.6 6.6 0 0 1 0-4.18V6.07H2.18a11 11 0 0 0 0 9.86l3.65-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 5.36c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.65 2.84C6.7 7.3 9.13 5.36 12 5.36z"
        />
      </svg>
    ),
  },
  naver: {
    cls: "bg-[#03C75A] text-white hover:brightness-95",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[16px]" aria-hidden>
        <path
          fill="#fff"
          d="M16.27 12.85 7.38 4H4v16h3.73v-8.85L16.62 20H20V4h-3.73z"
        />
      </svg>
    ),
  },
};

type Props = {
  mode: "login" | "signup";
  // called after a successful login; `isNewUser` is true when the account was just created
  onSuccess: (isNewUser: boolean) => void;
};

export function SocialButtons({ mode, onSuccess }: Props) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  const start = async (provider: Provider) => {
    setBusy(provider);
    setError("");
    // if the whole page has to be left (popup blocked), where to land afterwards
    const here = window.location.pathname;
    const returnTo =
      here === "/login"
        ? "/mypage"
        : here === "/signup"
          ? "/studio"
          : here + window.location.search;
    const outcome = await startSocialLogin(provider, returnTo);
    setBusy(null);
    if (!outcome) return; // the user closed the popup
    if (!outcome.ok) {
      if (outcome.code !== "ACCESS_DENIED") setError(outcome.message);
      return;
    }
    login(userKey(outcome.user));
    onSuccess(outcome.isNewUser);
  };

  return (
    <div className="flex flex-col gap-2">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => start(p.id)}
          disabled={busy !== null}
          className={`flex items-center justify-center gap-2.5 rounded-lg py-3 text-[13px] font-bold transition disabled:opacity-60 ${LOOK[p.id].cls}`}
        >
          {LOOK[p.id].icon}
          {busy === p.id
            ? "로그인 창을 확인해 주세요…"
            : `${p.name}로 ${mode === "signup" ? "시작하기" : "로그인"}`}
        </button>
      ))}
      {error && (
        <p
          role="alert"
          className="text-[12px] font-semibold text-[color:var(--c-text-e0553a)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
