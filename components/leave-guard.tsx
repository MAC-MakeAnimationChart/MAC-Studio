"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Pending = { kind: "link"; href: string } | { kind: "back" };

type Options = {
  dirty: boolean;
  // Saves the current work; returns true if it was saved. Offered as "저장하고 이동".
  onSave: () => boolean;
};

// Asks before the user leaves the page with unsaved changes.
// - Closing the tab / reloading: the browser's own prompt (browsers don't allow a custom one).
// - Clicking a link inside the app, or the browser's back button: our own dialog with Save.
export function useLeaveGuard({ dirty, onSave }: Options) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const saveRef = useRef(onSave);
  const bypass = useRef(false);

  useEffect(() => {
    saveRef.current = onSave;
  });

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // In-app links: caught before Next's router sees the click.
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      e.preventDefault();
      e.stopPropagation();
      setPending({ kind: "link", href: url.pathname + url.search + url.hash });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty]);

  // Browser back button. While there are unsaved changes one extra history entry is parked
  // behind the page, so "back" lands on this same page first and we can ask. Only one entry is
  // ever parked: it is used up when the user goes back while nothing is unsaved.
  const dirtyRef = useRef(dirty);
  const parked = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
    if (dirty && !parked.current) {
      history.pushState(history.state, "", location.href);
      parked.current = true;
    }
  }, [dirty]);

  useEffect(() => {
    const onPop = () => {
      if (bypass.current) return;
      if (!dirtyRef.current) {
        parked.current = false;
        return;
      }
      history.pushState(history.state, "", location.href);
      setPending({ kind: "back" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const proceed = (p: Pending) => {
    bypass.current = true;
    if (p.kind === "link") router.push(p.href);
    else history.go(-2); // past the parked entry and the page itself
  };

  const leave = () => {
    if (pending) proceed(pending);
    setPending(null);
  };

  const saveAndLeave = () => {
    if (!pending) return;
    if (!saveRef.current()) return setPending(null); // save failed (toast already shown): stay
    proceed(pending);
    setPending(null);
  };

  const dialog = pending ? (
    <LeaveDialog
      onStay={() => setPending(null)}
      onLeave={leave}
      onSaveAndLeave={saveAndLeave}
    />
  ) : null;
  return { dialog };
}

function LeaveDialog({
  onStay,
  onLeave,
  onSaveAndLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
  onSaveAndLeave: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onStay();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onStay]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--c-bg-0c1b4c)]/40 px-4"
      onClick={onStay}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        aria-describedby="leave-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-lg bg-[color:var(--c-bg-ffffff)] p-6 shadow-[0_20px_60px_rgba(12,27,76,0.3)]"
      >
        <h2
          id="leave-title"
          className="text-[16px] font-bold text-[color:var(--c-text-0c1b4c)]"
        >
          저장하지 않은 변경 사항이 있어요
        </h2>
        <p
          id="leave-desc"
          className="mt-2 text-[13px] leading-[1.7] text-[color:var(--c-text-4a5272)]"
        >
          이대로 나가면 수정한 내용이 사라져요. 저장하고 나갈까요?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            autoFocus
            onClick={onSaveAndLeave}
            className="rounded-lg bg-[color:var(--c-bg-2f66f5)] py-2.5 text-[13px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)]"
          >
            저장하고 나가기
          </button>
          <button
            onClick={onLeave}
            className="rounded-lg border border-[color:var(--c-border-e4e7ee)] py-2.5 text-[13px] font-bold text-[color:var(--c-text-667087)] hover:bg-[color:var(--c-bg-fafbfc)]"
          >
            저장하지 않고 나가기
          </button>
          <button
            onClick={onStay}
            className="py-2 text-[13px] font-medium text-[color:var(--c-text-7b8497)] hover:text-[color:var(--c-text-0c1b4c)]"
          >
            계속 편집하기
          </button>
        </div>
      </div>
    </div>
  );
}
