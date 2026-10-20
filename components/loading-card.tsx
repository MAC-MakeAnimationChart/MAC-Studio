import type { ReactNode } from "react";
import { IsoBarsLoader } from "./iso-bars-loader";

type Props = {
  visible?: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

// A card with the bar loader, to drop into any container that is waiting for something.
// Toggle `visible` to fade it in and out; while hidden it takes no clicks and is hidden from
// screen readers. The status text is announced when it appears.
export function LoadingCard({
  visible = true,
  title,
  description,
  children,
  className = "",
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`flex w-full max-w-[420px] flex-col items-center gap-4 rounded-lg border border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)] px-6 py-8 text-center shadow-[0_8px_30px_rgba(37,52,89,0.06)] transition-[opacity,transform,visibility] duration-300 ease-out motion-reduce:transition-none ${visible ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-2 opacity-0"} ${className}`}
    >
      <IsoBarsLoader size={112} />
      <div className="flex flex-col gap-1">
        <p className="text-[18px] font-bold tracking-[-0.01em] text-[color:var(--c-text-0c1b4c)]">
          {title}
        </p>
        {description && (
          <p className="text-[13px] text-[color:var(--c-text-7b8497)]">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
