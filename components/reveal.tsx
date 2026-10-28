"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// Fades and lifts its children in the first time they scroll into view. No library: an
// IntersectionObserver flips a data attribute and the transition lives in globals.css (.reveal).
//
// Safe by default: the server HTML is fully visible. After hydration only elements that are
// still below the fold are hidden (so nothing flashes), and with "reduce motion" nothing moves.
type Props = {
  children: ReactNode;
  as?: "div" | "li" | "section";
  className?: string;
  // ms to wait before starting, to stagger siblings
  delay?: number;
};

export function Reveal({
  children,
  as = "div",
  className = "",
  delay = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as as "div";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // already on screen (or scrolled past, e.g. an anchor jump): leave it alone
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.dataset.reveal = "hidden";
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.dataset.reveal = "shown";
        io.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
