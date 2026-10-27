"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import {
  acceptTerms,
  socialLogin,
  userKey,
  type AuthUser,
  type Provider,
  type SocialLoginResponse,
} from "@/lib/auth-api";
import { login, logout } from "@/lib/auth";
import {
  PROVIDERS,
  SOCIAL_MESSAGE,
  takePending,
  type Pending,
  type SocialMessage,
  type SocialOutcome,
} from "@/lib/social-auth";

// The page the provider sends the user back to (inside the popup). It exchanges the code through
// the backend, asks for the terms if this is a first login, then reports to the window that opened
// it. Without an opener (popup blocked, so the whole page was used) it logs in and moves on itself.
type Step =
  | { kind: "working" }
  | { kind: "terms"; res: SocialLoginResponse; pending: Pending }
  | { kind: "error"; message: string };

const fail = (code: string, message: string): SocialOutcome => ({
  ok: false,
  code,
  message,
});

export function SocialCallback({ provider }: { provider: Provider }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "working" });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const name = PROVIDERS.find((p) => p.id === provider)?.name ?? provider;

  // Reports the result to the opener, or finishes here when this page is the whole window.
  const report = (pending: Pending, outcome: SocialOutcome) => {
    if (window.opener) {
      const msg: SocialMessage = {
        type: SOCIAL_MESSAGE,
        state: pending.state,
        outcome,
      };
      window.opener.postMessage(msg, window.location.origin);
      window.close();
      // a window the script did not open cannot be closed; say so instead of leaving a blank page
      setTimeout(
        () =>
          setStep({
            kind: "error",
            message: outcome.ok
              ? "로그인했어요. 이 창을 닫아 주세요."
              : outcome.message,
          }),
        300,
      );
      return;
    }
    if (outcome.ok) {
      login(userKey(outcome.user));
      router.replace(pending.returnTo || "/mypage");
    } else setStep({ kind: "error", message: outcome.message });
  };

  useEffect(() => {
    if (started.current) return; // React runs effects twice in development; a code works once
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const pending = takePending(params.get("state"));
    const stop = (code: string, message: string) => {
      if (pending) report(pending, fail(code, message));
      else setStep({ kind: "error", message });
    };
    if (!pending || pending.provider !== provider)
      return stop(
        "INVALID_STATE",
        "로그인 요청이 만료됐거나 올바르지 않아요. 처음부터 다시 시도해 주세요.",
      );
    const code = params.get("code");
    if (params.get("error") || !code)
      return stop("ACCESS_DENIED", `${name} 로그인을 취소했어요.`);

    socialLogin({
      provider,
      code,
      codeVerifier: pending.verifier,
      redirectUri: pending.redirectUri,
    })
      .then((res) => {
        if (res.needsTerms) setStep({ kind: "terms", res, pending });
        else
          report(pending, {
            ok: true,
            user: res.user,
            isNewUser: res.isNewUser,
          });
      })
      .catch((e: unknown) =>
        stop(
          e instanceof ApiError ? e.code : "UNKNOWN",
          e instanceof Error ? e.message : "로그인하지 못했어요.",
        ),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on arrival
  }, []);

  const accept = async () => {
    if (step.kind !== "terms") return;
    setBusy(true);
    try {
      const user: AuthUser = await acceptTerms();
      report(step.pending, { ok: true, user, isNewUser: step.res.isNewUser });
    } catch (e) {
      setBusy(false);
      setStep({
        kind: "error",
        message: e instanceof Error ? e.message : "동의를 저장하지 못했어요.",
      });
    }
  };

  const decline = () => {
    if (step.kind !== "terms") return;
    logout(); // the session the backend already issued is dropped
    report(
      step.pending,
      fail("TERMS_DECLINED", "약관에 동의해야 가입할 수 있어요."),
    );
  };

  const check = "size-4 shrink-0 accent-[#2F66F5]";
  const linkCls = "font-bold text-[color:var(--c-text-2f66f5)] hover:underline";

  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6 py-10 text-[color:var(--c-text-0c1b4c)]">
      <div className="rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-7 shadow-[0_8px_30px_rgba(37,52,89,0.03)]">
        {step.kind === "working" && (
          <div role="status" className="py-6 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-[3px] border-[color:var(--c-border-e3e6f0)] border-t-[color:var(--c-border-2f66f5)]" />
            <p className="mt-4 text-[14px] font-bold">{name} 로그인 중…</p>
            <p className="mt-1 text-[12px] text-[color:var(--c-text-99a1b1)]">
              잠시만 기다려 주세요.
            </p>
          </div>
        )}

        {step.kind === "terms" && (
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.02em]">
              약관에 동의해 주세요
            </h1>
            <p className="mt-1.5 text-[12px] leading-[1.7] text-[color:var(--c-text-99a1b1)]">
              {name} 계정으로 처음 오셨네요. 서비스를 쓰려면 아래 내용에 동의가
              필요해요.
            </p>
            <div className="mt-5 flex flex-col gap-3 text-[13px]">
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className={check}
                />
                <span>
                  (필수){" "}
                  <Link href="/terms" target="_blank" className={linkCls}>
                    이용약관
                  </Link>
                  에 동의해요
                </span>
              </label>
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className={check}
                />
                <span>
                  (필수){" "}
                  <Link href="/privacy" target="_blank" className={linkCls}>
                    개인정보처리방침
                  </Link>
                  에 동의해요
                </span>
              </label>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={decline}
                disabled={busy}
                className="rounded-lg border border-[color:var(--c-border-b9bfd3)] py-2.5 text-[13px] font-bold hover:bg-[color:var(--c-bg-fafafc)] disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={accept}
                disabled={busy || !agreeTerms || !agreePrivacy}
                className="rounded-lg bg-[color:var(--c-bg-2f66f5)] py-2.5 text-[13px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)] disabled:opacity-50"
              >
                {busy ? "처리 중…" : "동의하고 시작"}
              </button>
            </div>
          </div>
        )}

        {step.kind === "error" && (
          <div className="py-2 text-center">
            <p role="alert" className="text-[14px] font-bold">
              {step.message}
            </p>
            <button
              type="button"
              onClick={() =>
                window.opener ? window.close() : router.replace("/")
              }
              className="mt-5 rounded-lg border border-[color:var(--c-border-b9bfd3)] px-5 py-2 text-[13px] font-bold hover:bg-[color:var(--c-bg-fafafc)]"
            >
              {window.opener ? "창 닫기" : "처음으로"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
