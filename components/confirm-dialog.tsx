"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  // red confirm button, for things that cannot be undone
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// "Are you sure?" dialog. Render it only while a question is pending; the parent decides what
// happens on confirm. Focus starts on Cancel so a stray Enter never deletes anything.
export function ConfirmDialog({
  title,
  children,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const cancelBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onCancel();
      if (e.key !== "Tab" || !panel.current) return;
      // keep Tab inside the dialog
      const items = panel.current.querySelectorAll<HTMLElement>("button");
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C1B4C]/50 px-4 py-6"
      onClick={onCancel}
    >
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-6 shadow-[0_20px_60px_rgba(12,27,76,0.3)]"
      >
        <h2 id="confirm-title" className="text-[17px] font-bold">
          {title}
        </h2>
        <div
          id="confirm-desc"
          className="mt-2 text-[13px] leading-[1.7] text-[color:var(--c-text-4a5272)]"
        >
          {children}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelBtn}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[color:var(--c-border-b9bfd3)] px-4 py-2 text-[13px] font-bold text-[color:var(--c-text-0c1b4c)] hover:bg-[color:var(--c-bg-fafafc)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-[13px] font-bold text-white ${danger ? "bg-[color:var(--c-bg-e0553a)] hover:opacity-90" : "bg-[color:var(--c-bg-2f66f5)] hover:bg-[color:var(--c-bg-2757d6)]"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
