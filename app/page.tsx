import Link from "next/link";
import { HeroDemo } from "@/components/hero-demo";
import { STUDIO_CATALOG, EXPERT_CHART_COUNT } from "@/lib/chart-catalog";
import {
  FREE_UPLOAD_MB,
  MEMBER_STORAGE_MB,
  MEMBER_UPLOAD_MB,
} from "@/lib/limits";

const steps = [
  { title: "데이터셋 업로드", desc: "CSV 또는 XLSX를 올려요." },
  { title: "차트 선택", desc: "차트를 하나 골라요." },
  { title: "변환", desc: "기본값으로 자동 설정돼요." },
  { title: "차트 수정", desc: "제목, 색상, 범례를 다듬어요." },
  { title: "추출하기", desc: "JPG, PNG, TIFF로 내려받아요." },
];

const available = STUDIO_CATALOG.filter((c) => c.available).length;

export default function Home() {
  return (
    <main className="text-[color:var(--c-text-0c1b4c)]">
      <section className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-8 pt-[88px] text-center">
        <h1 className="text-[40px] font-light leading-[1.15] tracking-[-0.03em] sm:text-[60px]">
          데이터를 올리면,
          <br />
          차트가 완성돼요.
        </h1>
        <p className="max-w-[560px] text-[17px] leading-[1.75] text-[color:var(--c-text-4a5272)]">
          코딩 없이 CSV나 엑셀 파일만 올리세요. 차트를 고르고 다듬어서 JPG, PNG,
          TIFF로 바로 내려받을 수 있어요. 파일은 내 브라우저 안에서만 처리돼요.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--c-bg-2f66f5)] px-6 py-3.5 text-[15px] font-medium text-white hover:bg-[color:var(--c-bg-2757d6)]"
          >
            스튜디오 시작하기 →
          </Link>
          <a
            href="#tutorial"
            className="inline-block rounded-lg border border-[color:var(--c-border-b9bfd3)] px-6 py-3.5 text-[15px] font-medium hover:bg-[color:var(--c-bg-ffffff)]"
          >
            튜토리얼 보기
          </a>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-[1200px] px-8">
        <HeroDemo />
      </section>

      <section
        id="tutorial"
        className="mt-24 scroll-mt-16 bg-[color:var(--c-bg-eaf0ff)] py-20"
      >
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-[38px] font-light tracking-[-0.02em]">
              5단계면 충분해요
            </h2>
          </div>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="flex flex-col gap-2.5 rounded-lg border border-[color:var(--c-border-d6e2fa)] bg-[color:var(--c-bg-ffffff)] p-[22px]"
              >
                <span className="font-mono text-[12px] text-[color:var(--c-text-2f66f5)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <b className="text-[16px]">{s.title}</b>
                <span className="text-[13px] leading-[1.7] text-[color:var(--c-text-4a5272)]">
                  {s.desc}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3.5 text-[14px] text-[color:var(--c-text-2b3352)]">
            <span className="inline-flex items-center rounded-full border border-[color:var(--c-border-f97316)] px-3 py-1 text-[12px] font-medium text-[color:var(--c-text-c2410c)]">
              회원
            </span>
            회원이면 데이터셋 폴더 아래에 차트를 저장하고, 마이페이지에서 다시
            편집할 수 있어요.
          </div>
        </div>
      </section>

      <section
        id="charts"
        className="mx-auto flex max-w-[1200px] scroll-mt-16 flex-col gap-8 px-8 py-24"
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-[38px] font-light tracking-[-0.02em]">
            지원하는 차트
          </h2>
          <p className="text-[15px] leading-7 text-[color:var(--c-text-4a5272)]">
            MAC Studio(무료)는 총 {STUDIO_CATALOG.length}가지 차트를 제공할
            예정이에요. 지금은{" "}
            <b className="text-[color:var(--c-text-2f66f5)]">{available}가지</b>
            를 바로 만들 수 있고, 나머지는 순서대로 열어요.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STUDIO_CATALOG.map((c) => (
            <li
              key={c.no}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${c.available ? "border-[color:var(--c-border-c7d6fa)] bg-[color:var(--c-bg-f3f7ff)]" : "border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)]"}`}
            >
              <span className="mt-0.5 font-mono text-[11px] text-[color:var(--c-text-9aa1b8)]">
                {String(c.no).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium">{c.ko}</div>
                <div className="mt-0.5 truncate text-[11px] text-[color:var(--c-text-7b8497)]">
                  {c.en}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.available ? "bg-[color:var(--c-bg-2f66f5)] text-white" : "bg-[color:var(--c-bg-f1f3f9)] text-[color:var(--c-text-6b7390)]"}`}
              >
                {c.available ? "이용 가능" : "준비 중"}
              </span>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 text-[13px] text-[color:var(--c-text-6b7390)]">
          <span className="inline-block size-2 rounded-full bg-[color:var(--c-bg-f97316)]" />
          유료 버전(Expert)에서는 Studio 차트를 포함해 총 {EXPERT_CHART_COUNT}
          가지 차트를 제공할 예정이에요.
        </p>
      </section>

      <section className="mx-auto max-w-[1200px] px-8 pb-24">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)] p-7">
            <h3 className="mt-2 text-[20px] font-medium">파일 형식</h3>
            <dl className="mt-5 grid grid-cols-[88px_1fr] gap-y-3 text-[14px]">
              <dt className="text-[color:var(--c-text-6b7390)]">올리기</dt>
              <dd>CSV, XLSX</dd>
              <dt className="text-[color:var(--c-text-6b7390)]">내려받기</dt>
              <dd>JPG, PNG, TIFF (이미지) · CSV (데이터)</dd>
            </dl>
          </div>
          <div className="rounded-lg border border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)] p-7">
            <h3 className="mt-2 text-[20px] font-medium">비회원 vs 회원</h3>
            <table className="mt-5 w-full text-left text-[14px]">
              <thead>
                <tr className="text-[color:var(--c-text-6b7390)]">
                  <th className="pb-2 font-medium" />
                  <th className="pb-2 font-medium">비회원</th>
                  <th className="pb-2 font-medium">회원</th>
                </tr>
              </thead>
              <tbody className="[&_td]:border-t [&_td]:border-[color:var(--c-border-e3e6f0)] [&_td]:py-2.5 [&_th]:border-t [&_th]:border-[color:var(--c-border-e3e6f0)] [&_th]:py-2.5">
                <tr>
                  <th className="pr-3 font-medium">업로드 용량</th>
                  <td>{FREE_UPLOAD_MB} MB</td>
                  <td>{MEMBER_UPLOAD_MB} MB</td>
                </tr>
                <tr>
                  <th className="pr-3 font-medium">차트 만들기·내보내기</th>
                  <td>가능</td>
                  <td>가능</td>
                </tr>
                <tr>
                  <th className="pr-3 font-medium">저장 · 마이페이지</th>
                  <td>없음</td>
                  <td>{MEMBER_STORAGE_MB} MB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 px-8 pb-24 text-center">
        <h2 className="text-[38px] font-light tracking-[-0.02em]">
          지금 첫 차트를 만들어 보세요
        </h2>
        <p className="text-[15px] text-[color:var(--c-text-4a5272)]">
          샘플 데이터로 1분 안에 체험할 수 있어요.
        </p>
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--c-bg-2f66f5)] px-[26px] py-3.5 text-[15px] font-medium text-white hover:bg-[color:var(--c-bg-2757d6)]"
        >
          스튜디오 시작하기 →
        </Link>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-[color:var(--c-text-6b7390)]">
          <span className="inline-block size-2 rounded-full bg-[color:var(--c-bg-f97316)]" />
          더 많은 차트와 기능은 MAC Expert에서 제공할 예정이에요.
        </p>
      </section>
    </main>
  );
}
