// Placeholder for the ads. Replace the inside of this component with the real ad code when an
// ad provider is chosen; the pages that use it do not need to change.
//   rect:       336 x 250, the loading screen
//   skyscraper: 160 x 600, both sides of the login / sign-up pages
const VARIANTS = {
  rect: { name: "loading", width: 336, height: 250 },
  skyscraper: { name: "side", width: 160, height: 600 },
} as const;

type Props = { variant?: keyof typeof VARIANTS; className?: string };

export function AdSlot({ variant = "rect", className = "" }: Props) {
  const { name, width, height } = VARIANTS[variant];
  return (
    <div
      data-ad-slot={name}
      role="complementary"
      aria-label="광고"
      style={{ width, height, maxWidth: "100%" }}
      className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[color:var(--c-border-c9cedb)] bg-[color:var(--c-bg-ffffff)] text-center ${className}`}
    >
      <span className="rounded border border-[color:var(--c-border-e3e6f0)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--c-text-9aa1b8)]">
        광고
      </span>
      <span className="mt-1 text-[12px] text-[color:var(--c-text-9aa1b8)]">
        광고 영역
        <br />({width} × {height})
      </span>
      <span className="px-2 text-[11px] text-[color:var(--c-text-b1b7c4)]">
        광고 연결 전 자리표시예요
      </span>
    </div>
  );
}
