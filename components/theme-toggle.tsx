"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "system", label: "시스템 설정 따르기", icon: Monitor },
];

export function ThemeToggle() {
  const { choice, theme, setChoice } = useTheme();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const Icon = theme === "dark" ? Moon : Sun;

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="화면 모드"
        aria-haspopup="menu"
        aria-expanded={open}
        title="화면 모드"
        className="flex size-9 items-center justify-center rounded-lg text-[color:var(--c-text-4a5272)] hover:bg-[color:var(--c-bg-f5f6fa)]"
      >
        <Icon size={17} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="화면 모드"
          className="absolute right-0 top-full z-30 mt-2 w-[200px] rounded-lg border border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)] p-1.5 shadow-[0_12px_40px_rgba(12,27,76,0.14)]"
        >
          {OPTIONS.map(({ value, label, icon: OptionIcon }) => (
            <button
              key={value}
              role="menuitemradio"
              aria-checked={choice === value}
              onClick={() => {
                setChoice(value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-[color:var(--c-text-0c1b4c)] hover:bg-[color:var(--c-bg-f5f6fa)]"
            >
              <OptionIcon
                size={15}
                className="text-[color:var(--c-text-7b8497)]"
              />
              <span className="flex-1">{label}</span>
              {choice === value && (
                <Check
                  size={14}
                  className="text-[color:var(--c-text-2f66f5)]"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
