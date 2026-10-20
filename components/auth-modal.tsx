"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

type Mode = "login" | "signup";

const AuthModalContext = createContext<(mode: Mode) => void>(() => {});

// Opens the login / sign-up dialog on top of the current page, so a visitor with unsaved work
// can sign up without leaving (and losing) it.
export const useAuthModal = () => useContext(AuthModalContext);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const open = useCallback((m: Mode) => setMode(m), []);
  const close = useCallback(() => setMode(null), []);
  const value = useMemo(() => open, [open]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {mode && (
        <AuthDialog mode={mode} onModeChange={setMode} onClose={close} />
      )}
    </AuthModalContext.Provider>
  );
}

function AuthDialog({
  mode,
  onModeChange,
  onClose,
}: {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panel.current) return;
      // keep Tab inside the dialog
      const items = panel.current.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      if (items.length === 0) return;
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
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C1B4C]/50 px-4 py-6"
      onClick={onClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-full w-full max-w-[420px] overflow-y-auto rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-7 shadow-[0_20px_60px_rgba(12,27,76,0.3)]"
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 rounded-md p-1.5 text-[color:var(--c-text-9da5b5)] hover:bg-[color:var(--c-bg-f5f6fa)]"
        >
          <X size={16} />
        </button>
        <AuthForm
          key={mode}
          mode={mode}
          embedded
          onSwitch={onModeChange}
          onDone={(signup) => {
            onClose();
            toast.success(signup ? "가입했어요" : "로그인했어요", {
              id: "auth-done",
              duration: 4000,
              description:
                "작업하던 차트는 그대로예요. 저장 버튼을 눌러 보관하세요.",
            });
          }}
        />
      </div>
    </div>
  );
}
