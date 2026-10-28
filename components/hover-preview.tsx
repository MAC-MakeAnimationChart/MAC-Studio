"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Wraps a chart card and shows the chart's example picture next to it: on mouse hover, on keyboard
// focus, and (touch) when the card is tapped. Without a picture it is just a plain wrapper.
const WIDTH = 340;
const HEIGHT = 290; // rough height of the popover, to decide whether it fits below the card

export function HoverPreview({
  preview,
  className = "",
  children,
}: {
  preview: ReactNode | undefined;
  className?: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const pointer = useRef<string>("mouse");
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ right: false, above: false });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!preview) return <div className={className}>{children}</div>;

  const show = () => {
    const r = box.current?.getBoundingClientRect();
    if (r)
      setPlace({
        right: r.left + WIDTH > window.innerWidth - 16,
        above: r.bottom + HEIGHT > window.innerHeight && r.top > HEIGHT,
      });
    setOpen(true);
  };

  return (
    <div
      ref={box}
      className={`relative ${className}`}
      tabIndex={0}
      onPointerDown={(e) => (pointer.current = e.pointerType)}
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      // keyboard focus only: a tap also focuses, and the click below handles taps
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && show()}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onClick={() => {
        if (pointer.current === "mouse") return;
        if (open) setOpen(false);
        else show();
      }}
    >
      {children}
      {open && (
        <div
          role="tooltip"
          className={`absolute z-30 rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-2 shadow-[0_12px_40px_rgba(12,27,76,0.18)] ${place.right ? "right-0" : "left-0"} ${place.above ? "bottom-full mb-2" : "top-full mt-2"}`}
          style={{ width: WIDTH, maxWidth: "calc(100vw - 32px)" }}
        >
          <div className="overflow-hidden rounded-md border border-[color:var(--c-border-edf0f5)]">
            {preview}
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-[color:var(--c-text-7b8497)]">
            샘플 데이터로 그린 예시예요.
          </p>
        </div>
      )}
    </div>
  );
}
