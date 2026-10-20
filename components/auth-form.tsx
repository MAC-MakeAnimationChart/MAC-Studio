"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import {
  CODE_LENGTH,
  RESEND_AFTER_MS,
  sendVerificationCode,
  verifyCode,
} from "@/lib/email-verification";

const input =
  "w-full rounded-lg border border-[color:var(--c-border-e4e7ee)] px-4 py-3 text-[13px] outline-none focus:border-[color:var(--c-border-4f7cf5)]";
const primary =
  "rounded-lg bg-[color:var(--c-bg-2f66f5)] py-3 text-[13px] font-bold text-white shadow-lg shadow-[#2F66F5]/20 hover:bg-[color:var(--c-bg-2757d6)] disabled:opacity-60";

type Props = {
  mode: "login" | "signup";
  // Embedded (inside the modal): no page chrome, stays on the current page after success.
  embedded?: boolean;
  onDone?: (signup: boolean) => void;
  onSwitch?: (mode: "login" | "signup") => void;
};

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function AuthForm({ mode, embedded = false, onDone, onSwitch }: Props) {
  const router = useRouter();
  const signup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  // sign-up step 2: the emailed code
  const [step, setStep] = useState<"form" | "code">("form");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(0);

  const normalized = email.trim().toLowerCase();

  useEffect(() => {
    if (step !== "code") return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [step, sentAt]);

  const finish = () => {
    login(normalized);
    if (embedded) onDone?.(signup);
    else router.push(signup ? "/studio" : "/mypage");
  };

  const sendCode = async () => {
    setBusy(true);
    setError("");
    const result = await sendVerificationCode(normalized);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setDevCode(result.devCode);
    setExpiresAt(result.expiresAt);
    setSentAt(result.sentAt);
    setNow(Date.now());
    setCode("");
    setStep("code");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email))
      return setError("이메일 형식을 확인해 주세요.");
    if (!password) return setError("비밀번호를 입력해 주세요.");
    if (signup && password.length < 8)
      return setError("비밀번호는 8자 이상이어야 해요.");
    if (signup && password !== confirm)
      return setError("비밀번호가 서로 달라요.");
    if (!signup) return finish();
    sendCode();
  };

  const check = async (value: string) => {
    if (busy) return;
    if (value.length !== CODE_LENGTH)
      return setError(`${CODE_LENGTH}자리 숫자를 입력해 주세요.`);
    setBusy(true);
    const result = await verifyCode(normalized, value);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      if (result.reason !== "wrong") setCode("");
      return;
    }
    finish();
  };

  const onCodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setError("");
    if (digits.length === CODE_LENGTH) check(digits); // verify as soon as it is complete
  };

  const switchText = signup ? "로그인" : "회원가입";
  const switchPrompt = signup ? "이미 계정이 있나요? " : "아직 계정이 없나요? ";
  const inCodeStep = signup && step === "code";
  const titleText = inCodeStep ? "이메일 인증" : signup ? "회원가입" : "로그인";
  const remaining = Math.max(0, expiresAt - now);
  const resendIn = Math.max(0, sentAt + RESEND_AFTER_MS - now);

  const heading = embedded ? (
    <h2
      id="auth-modal-title"
      className="text-[20px] font-bold tracking-[-0.02em]"
    >
      {titleText}
    </h2>
  ) : (
    <h1 className="text-[22px] font-bold tracking-[-0.02em]">{titleText}</h1>
  );

  const body = inCodeStep ? (
    <>
      {heading}
      <p className="mt-1.5 text-[12px] leading-[1.7] text-[color:var(--c-text-99a1b1)]">
        <b className="text-[color:var(--c-text-4a5272)]">{normalized}</b>로
        인증코드 {CODE_LENGTH}자리를 보냈어요. 받은 코드를 입력하면 가입이
        끝나요.
      </p>

      <div
        role="note"
        className="mt-4 rounded-lg border border-dashed border-[color:var(--c-border-f97316)] px-3 py-2.5 text-[11px] leading-5 text-[color:var(--c-text-4a5272)]"
      >
        데모 안내: 아직 이메일을 보내는 서버가 없어서 코드를 여기에 보여줘요.
        실제 서비스에서는 이 칸 없이 이메일로만 도착해요.
        <div className="mt-1 text-[18px] font-bold tracking-[0.3em] text-[color:var(--c-text-0c1b4c)]">
          {devCode}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          check(code);
        }}
        className="mt-5 flex flex-col gap-3"
        noValidate
      >
        <input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder={"0".repeat(CODE_LENGTH)}
          aria-label={`인증코드 ${CODE_LENGTH}자리`}
          className={`${input} text-center text-[20px] font-bold tracking-[0.4em]`}
        />
        <div className="flex items-center justify-between text-[11px] text-[color:var(--c-text-8891a5)]">
          <span aria-live="off">
            {remaining > 0 ? (
              <>
                남은 시간{" "}
                <b className="text-[color:var(--c-text-4a5272)]">
                  {clock(remaining)}
                </b>
              </>
            ) : (
              <span className="font-bold text-[color:var(--c-text-e0553a)]">
                코드가 만료됐어요
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={sendCode}
            disabled={busy || resendIn > 0}
            className="font-bold text-[color:var(--c-text-2f66f5)] hover:underline disabled:text-[color:var(--c-text-9aa1b8)] disabled:no-underline"
          >
            {resendIn > 0
              ? `${Math.ceil(resendIn / 1000)}초 후 다시 받기`
              : "코드 다시 받기"}
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="text-[12px] font-semibold text-[color:var(--c-text-e0553a)]"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || code.length !== CODE_LENGTH}
          className={`mt-1 ${primary}`}
        >
          {busy ? "확인 중…" : "인증하고 가입하기"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("form");
            setError("");
          }}
          className="text-[12px] font-medium text-[color:var(--c-text-7b8497)] hover:text-[color:var(--c-text-0c1b4c)]"
        >
          이메일 주소 바꾸기
        </button>
      </form>
    </>
  ) : (
    <>
      {heading}
      <p className="mt-1.5 text-[12px] text-[color:var(--c-text-99a1b1)]">
        {embedded
          ? "지금 만든 차트는 그대로 유지돼요. 가입하거나 로그인하면 바로 저장할 수 있어요."
          : signup
            ? "가입하면 데이터셋과 차트를 저장하고 마이페이지에서 다시 편집할 수 있어요."
            : "저장해 둔 데이터셋과 차트를 불러오세요."}
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3" noValidate>
        <input
          autoFocus={embedded}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          aria-label="이메일"
          autoComplete="email"
          className={input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          aria-label="비밀번호"
          autoComplete={signup ? "new-password" : "current-password"}
          className={input}
        />
        {signup && (
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="비밀번호 확인"
            aria-label="비밀번호 확인"
            autoComplete="new-password"
            className={input}
          />
        )}
        {error && (
          <p
            role="alert"
            className="text-[12px] font-semibold text-[color:var(--c-text-e0553a)]"
          >
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`mt-2 ${primary}`}>
          {signup ? (busy ? "보내는 중…" : "인증코드 받기") : "로그인"}
        </button>
      </form>
      <p className="mt-4 rounded-lg bg-[color:var(--c-bg-fafafc)] px-3 py-2.5 text-[11px] leading-5 text-[color:var(--c-text-8891a5)]">
        데모 안내: 아직 서버가 연결되지 않아 비밀번호는 저장·검증하지 않고,
        이메일만 이 브라우저에 보관해요. 저장한 데이터도 이 브라우저에만 남아요.
      </p>
    </>
  );

  const footer = !inCodeStep && (
    <p className="mt-5 text-center text-[12px] text-[color:var(--c-text-99a1b1)]">
      {switchPrompt}
      {embedded ? (
        <button
          type="button"
          onClick={() => onSwitch?.(signup ? "login" : "signup")}
          className="font-bold text-[color:var(--c-text-2f66f5)] hover:underline"
        >
          {switchText}
        </button>
      ) : (
        <Link
          href={signup ? "/login" : "/signup"}
          className="font-bold text-[color:var(--c-text-2f66f5)]"
        >
          {switchText}
        </Link>
      )}
    </p>
  );

  const content = (
    <>
      {body}
      {footer}
    </>
  );

  if (embedded) return <div>{content}</div>;

  return (
    <div className="mx-auto w-full max-w-[420px] px-6 py-16">
      <div className="rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-7 shadow-[0_8px_30px_rgba(37,52,89,0.03)] sm:p-8">
        {content}
      </div>
    </div>
  );
}
