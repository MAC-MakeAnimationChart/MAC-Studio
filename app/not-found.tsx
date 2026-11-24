import type { Metadata } from "next";
import Link from "next/link";

// Shown for any address that does not exist. Next.js answers with a 404 status and keeps it out of
// search results. The links give visitors (and crawlers) a way back into the site.
export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
  robots: { index: false, follow: true },
};

const link =
  "rounded-lg border border-[color:var(--c-border-b9bfd3)] px-5 py-2.5 text-[13px] font-bold hover:bg-[color:var(--c-bg-fafafc)]";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-6 py-24 text-center text-[color:var(--c-text-0c1b4c)]">
      <p className="font-mono text-[13px] text-[color:var(--c-text-2f66f5)]">
        404
      </p>
      <h1 className="text-[28px] font-bold tracking-[-0.03em]">
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-[14px] leading-[1.8] text-[color:var(--c-text-4a5272)]">
        주소가 바뀌었거나 없어진 페이지예요. 아래에서 원하는 곳으로 이동해
        주세요.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link href="/" className={link}>
          홈으로
        </Link>
        <Link
          href="/studio"
          className="rounded-lg bg-[color:var(--c-bg-2f66f5)] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)]"
        >
          차트 만들러 가기
        </Link>
        <Link href="/guide" className={link}>
          데이터 형식 안내
        </Link>
      </div>
    </main>
  );
}
