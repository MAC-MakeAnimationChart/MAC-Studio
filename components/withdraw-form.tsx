"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { isMock } from "@/lib/api-client";
import { logout, useUser } from "@/lib/auth";
import { getMe, withdraw, type AuthUser, type Provider } from "@/lib/auth-api";
import { PROVIDERS, startSocialLogin } from "@/lib/social-auth";

const input =
  "w-full rounded-lg border border-[color:var(--c-border-e4e7ee)] px-4 py-3 text-[13px] outline-none focus:border-[color:var(--c-border-4f7cf5)]";

// Withdrawal. The backend keeps the account (and its email) for 3 months and blocks signing up again
// with that email in the meantime; the user must tick that they know. Email accounts confirm with
// their password; social accounts sign in with their provider again first (re-authentication).
export function WithdrawForm() {
  const router = useRouter();
  const user = useUser();
  const [me, setMe] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(isMock);
  const [password, setPassword] = useState("");
  const [reauthed, setReauthed] = useState(false);
  const [ack, setAck] = useState(false);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isMock) return;
    getMe()
      .then(setMe)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // the mock has no account details: behave like an email account
  const hasPassword = isMock || (me?.hasPassword ?? true);
  const provider = me?.providers[0]?.toLowerCase() as Provider | undefined;
  const providerName = PROVIDERS.find((p) => p.id === provider)?.name ?? "";

  const reauth = async () => {
    if (!provider) return;
    setBusy(true);
    setError("");
    const outcome = await startSocialLogin(
      provider,
      "/withdraw",
      "reauth",
    );
    setBusy(false);
    if (!outcome) return; // popup closed
    if (!outcome.ok) return setError(outcome.message);
    setReauthed(true);
  };

  const ready = ack && (hasPassword ? password.length > 0 : reauthed);

  const run = async () => {
    setAsking(false);
    setBusy(true);
    setError("");
    try {
      await withdraw(hasPassword ? password : undefined);
      setPassword("");
      logout();
      toast.success("탈퇴했어요. 그동안 이용해 주셔서 감사합니다.");
      router.replace("/");
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "탈퇴하지 못했어요.");
    }
  };

  if (!user)
    return (
      <div className="mx-auto max-w-[420px] px-6 py-16 text-center text-[13px]">
        <p>로그인한 뒤에 탈퇴할 수 있어요.</p>
        <Link
          href="/login"
          className="mt-4 inline-block font-bold text-[color:var(--c-text-2f66f5)]"
        >
          로그인하러 가기
        </Link>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-[420px] px-6 py-16">
      <div className="rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-7 shadow-[0_8px_30px_rgba(37,52,89,0.03)] sm:p-8">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">회원 탈퇴</h1>
        <p className="mt-1.5 text-[12px] text-[color:var(--c-text-99a1b1)]">
          {user}
        </p>
        <div className="mt-5 rounded-lg bg-[color:var(--c-bg-fafafc)] px-4 py-3 text-[12px] leading-[1.8] text-[color:var(--c-text-4a5272)]">
          탈퇴하면 이 계정으로 로그인할 수 없어요. 탈퇴 후 계정 정보는 3개월간
          보관되며, 해당 기간 동안 같은 이메일로 다시 가입할 수 없어요.
        </div>

        {!loaded ? (
          <p className="mt-5 text-[12px] text-[color:var(--c-text-99a1b1)]">
            계정 정보를 확인하는 중…
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {hasPassword ? (
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="현재 비밀번호"
                aria-label="현재 비밀번호"
                autoComplete="current-password"
                className={input}
              />
            ) : (
              <button
                type="button"
                onClick={reauth}
                disabled={busy || reauthed || !provider}
                className="rounded-lg border border-[color:var(--c-border-b9bfd3)] py-3 text-[13px] font-bold hover:bg-[color:var(--c-bg-fafafc)] disabled:opacity-60"
              >
                {reauthed
                  ? `${providerName} 확인 완료`
                  : `${providerName} 계정으로 본인 확인`}
              </button>
            )}
            <label className="flex items-start gap-2 text-[12px] leading-5 text-[color:var(--c-text-4a5272)]">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[#2F66F5]"
              />
              <span>
                탈퇴 후 3개월 동안 같은 이메일로 다시 가입할 수 없다는 점을
                확인했어요.
              </span>
            </label>
            {error && (
              <p
                role="alert"
                className="text-[12px] font-semibold text-[color:var(--c-text-e0553a)]"
              >
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={() => setAsking(true)}
              disabled={busy || !ready}
              className="mt-1 rounded-lg bg-[color:var(--c-bg-e0553a)] py-3 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "처리 중…" : "탈퇴하기"}
            </button>
            <Link
              href="/mypage"
              className="text-center text-[12px] font-medium text-[color:var(--c-text-7b8497)] hover:text-[color:var(--c-text-0c1b4c)]"
            >
              그만두고 마이페이지로
            </Link>
          </div>
        )}
      </div>

      {asking && (
        <ConfirmDialog
          title="정말 탈퇴할까요?"
          confirmLabel="탈퇴"
          danger
          onConfirm={run}
          onCancel={() => setAsking(false)}
        >
          탈퇴하면 바로 로그아웃되고, 되돌릴 수 없어요.
        </ConfirmDialog>
      )}
    </div>
  );
}
