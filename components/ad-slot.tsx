// Placeholder for the ad shown on the loading screen. Replace the inside of this component with
// the real ad code when an ad provider is chosen; the loading page does not need to change.
export function AdSlot() {
  return (
    <div
      data-ad-slot="loading"
      role="complementary"
      aria-label="광고"
      className="flex h-[250px] w-full max-w-[336px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[color:var(--c-border-c9cedb)] bg-[color:var(--c-bg-ffffff)] text-center"
    >
      <span className="rounded border border-[color:var(--c-border-e3e6f0)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--c-text-9aa1b8)]">
        광고
      </span>
      <span className="mt-1 text-[12px] text-[color:var(--c-text-9aa1b8)]">
        광고 영역 (336 × 250)
      </span>
      <span className="text-[11px] text-[color:var(--c-text-b1b7c4)]">
        광고 연결 전 자리표시예요
      </span>
    </div>
  );
}
