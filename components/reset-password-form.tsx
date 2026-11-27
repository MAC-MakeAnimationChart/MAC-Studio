"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isMock } from "@/lib/api-client";
import {
  MOCK_RESET_CODE,
  resetPassword,
  sendEmailCode,
  verifyEmailCode,
} from "@/lib/auth-api";

const input =
  "w-full rounded-lg border border-[color:var(--c-border-e4e7ee)] px-4 py-3 text-[13px] outline-none focus:border-[color:var(--c-border-4f7cf5)]";
const primary =
  "rounded-lg bg-[color:var(--c-bg-2f66f5)] py-3 text-[13px] font-bold text-white shadow-lg shadow-[#2F66F5]/20 hover:bg-[color:var(--c-bg-2757d6)] disabled:opacity-60";
const CODE_LENGTH = 6;

// Forgot password: email -> emailed code -> new password. The server hides whether the email has an
// account, so "code sent" is shown either way. Afterwards the user logs in with the new password.
export function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const normalized = email.trim().toLowerCase();
  const fail = (e: unknown, fallback: string) =>
    setError(e instanceof Error && e.message ? e.message : fallback);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(normalized))
      return setError("이메일 형식을 확인해 주세요.");
    setBusy(true);
    setError("");
    try {
      const r = await sendEmailCode(normalized, "password_reset");
      setChallengeId(r.challengeId);
      setCode("");
      setStep("code");
    } catch (err) {
      fail(err, "인증코드를 보내지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH)
      return setError(`${CODE_LENGTH}자리 숫자를 입력해 주세요.`);
    setBusy(true);
    setError("");
    try {
      const r = await verifyEmailCode(challengeId, code);
      setToken(r.verificationToken);
      setStep("password");
    } catch (err) {
      fail(err, "인증하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 해요.");
    if (password !== confirm) return setError("비밀번호가 서로 달라요.");
    setBusy(true);
    setError("");
    try {
      await resetPassword(normalized, token, password);
      // drop the proof and passwords from memory, then back to login
      setToken("");
      setPassword("");
      setConfirm("");
      toast.success("비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.");
      router.push("/login");
    } catch (err) {
      fail(err, "비밀번호를 바꾸지 못했어요. 처음부터 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const errorLine = error && (
    <p
      role="alert"
      className="text-[12px] font-semibold text-[color:var(--c-text-e0553a)]"
    >
      {error}
    </p>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] px-6 py-16">
      <div className="rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-7 shadow-[0_8px_30px_rgba(37,52,89,0.03)] sm:p-8">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">
          비밀번호 재설정
        </h1>

        {step === "email" && (
          <form onSubmit={send} className="mt-5 flex flex-col gap-3" noValidate>
            <p className="text-[12px] leading-[1.7] text-[color:var(--c-text-99a1b1)]">
              가입한 이메일을 입력하면 인증코드를 보내드려요. 소셜 계정은 비밀번호가
              없어서 재설정할 수 없어요.
            </p>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              aria-label="이메일"
              autoComplete="email"
              className={input}
            />
            {errorLine}
            <button type="submit" disabled={busy} className={primary}>
              {busy ? "보내는 중…" : "인증코드 받기"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verify} className="mt-5 flex flex-col gap-3" noValidate>
            <p className="text-[12px] leading-[1.7] text-[color:var(--c-text-99a1b1)]">
              <b className="text-[color:var(--c-text-4a5272)]">{normalized}</b>
              로 인증코드를 보냈어요. 가입된 이메일이면 곧 도착해요.
            </p>
            {isMock && (
              <p className="rounded-lg border border-dashed border-[color:var(--c-border-f97316)] px-3 py-2 text-[11px] text-[color:var(--c-text-4a5272)]">
                데모 안내: 서버가 없어서 코드는 {MOCK_RESET_CODE}예요.
              </p>
            )}
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH));
                setError("");
              }}
              placeholder={"0".repeat(CODE_LENGTH)}
              aria-label={`인증코드 ${CODE_LENGTH}자리`}
              className={`${input} text-center text-[20px] font-bold tracking-[0.4em]`}
            />
            {errorLine}
            <button
              type="submit"
              disabled={busy || code.length !== CODE_LENGTH}
              className={primary}
            >
              {busy ? "확인 중…" : "인증하기"}
            </button>
            <button
              type="button"
              onClick={() => send()}
              disabled={busy}
              className="text-[12px] font-medium text-[color:var(--c-text-7b8497)] hover:text-[color:var(--c-text-0c1b4c)] disabled:opacity-60"
            >
              코드 다시 받기
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={save} className="mt-5 flex flex-col gap-3" noValidate>
            <p className="text-[12px] leading-[1.7] text-[color:var(--c-text-99a1b1)]">
              새 비밀번호를 정해 주세요. 바꾸면 다른 기기에서는 다시 로그인해야
              해요.
            </p>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호 (8자 이상)"
              aria-label="새 비밀번호"
              autoComplete="new-password"
              className={input}
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="새 비밀번호 확인"
              aria-label="새 비밀번호 확인"
              autoComplete="new-password"
              className={input}
            />
            {errorLine}
            <button type="submit" disabled={busy} className={primary}>
              {busy ? "저장 중…" : "비밀번호 바꾸기"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-[12px] text-[color:var(--c-text-99a1b1)]">
          <Link
            href="/login"
            className="font-bold text-[color:var(--c-text-2f66f5)]"
          >
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
