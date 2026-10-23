import type { ReactNode } from "react";

// Shared shell for the terms / privacy pages until their real text exists.
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-16 text-[color:var(--c-text-0c1b4c)]">
      <h1 className="text-[28px] font-bold tracking-[-0.03em]">{title}</h1>
      <div className="mt-6 flex flex-col gap-3 text-[14px] leading-[1.8] text-[color:var(--c-text-4a5272)]">
        {children}
      </div>
    </main>
  );
}
