import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { CHARTS } from "@/components/charts/registry";
import { GuideTable } from "@/components/guide-table";
import { PromptCopier, SampleDownloads } from "@/components/guide-tools";
import { CHART_NEEDS, DEFAULT_NEED, EXAMPLES, RULES } from "@/lib/data-guide";

export const metadata: Metadata = {
  title: "데이터 형식 안내 — MAC Studio",
  description:
    "차트가 되는 표 모양, 예시, 샘플 파일, AI에 정리를 맡기는 프롬프트",
};

const eyebrow =
  "font-mono text-[13px] tracking-[0.08em] text-[color:var(--c-text-2f66f5)]";
const card =
  "rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)]";

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-[1000px] px-6 pb-24 pt-14 text-[color:var(--c-text-0c1b4c)] sm:px-10">
      <header className="flex flex-col gap-3">
        <div className={eyebrow}>DATA GUIDE</div>
        <h1 className="text-[36px] font-light leading-[1.2] tracking-[-0.03em] sm:text-[44px]">
          차트가 되는 표, 이렇게 만들어요
        </h1>
        <p className="max-w-[640px] text-[15px] leading-[1.8] text-[color:var(--c-text-4a5272)]">
          아무 표나 차트가 되지는 않아요. 아래 모양에 맞추면 업로드하자마자
          차트를 그릴 수 있어요. 맞지 않아도 업로드 뒤 <b>데이터 확인</b>{" "}
          단계에서 문제를 찾아 고쳐 드려요.
        </p>
        <div>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--c-bg-2f66f5)] px-5 py-3 text-[14px] font-medium text-white hover:bg-[color:var(--c-bg-2757d6)]"
          >
            스튜디오에서 시작하기 <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className="mt-16 flex flex-col gap-6">
        <div>
          <div className={eyebrow}>RULES</div>
          <h2 className="mt-2 text-[26px] font-light tracking-[-0.02em]">
            다섯 가지만 지켜 주세요
          </h2>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {RULES.map((r, i) => (
            <li key={r.title} className={`${card} flex flex-col gap-2 p-4`}>
              <span className="font-mono text-[12px] text-[color:var(--c-text-2f66f5)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <b className="text-[14px]">{r.title}</b>
              <span className="text-[12px] leading-[1.7] text-[color:var(--c-text-7b8497)]">
                {r.desc}
              </span>
            </li>
          ))}
        </ol>
        <div className={`${card} p-5`}>
          <p className="mb-3 text-[13px] font-bold">이런 모양이에요</p>
          <GuideTable
            table={{
              headers: ["월", "방문자(명)", "전환수(건)"],
              rows: [
                ["1월", "1200", "90"],
                ["2월", "1850", "140"],
                ["3월", "1500", "110"],
              ],
            }}
            tone="good"
          />
          <p className="mt-3 text-[12px] leading-[1.7] text-[color:var(--c-text-7b8497)]">
            첫 줄은 열 이름, 첫 열은 항목 이름(월), 나머지는 숫자예요.
            엑셀(.xlsx)이든 CSV든 같은 모양이면 돼요.
          </p>
        </div>
      </section>

      <section className="mt-16 flex flex-col gap-6">
        <div>
          <div className={eyebrow}>COMMON PROBLEMS</div>
          <h2 className="mt-2 text-[26px] font-light tracking-[-0.02em]">
            자주 생기는 문제와 고치는 법
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {EXAMPLES.map((ex) => (
            <article key={ex.title} className={`${card} p-5`}>
              <h3 className="text-[15px] font-bold">{ex.title}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] font-bold text-[color:var(--c-text-e0553a)]">
                    이런 표는 곤란해요
                  </p>
                  <GuideTable table={ex.bad} tone="bad" />
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-bold text-[color:var(--c-text-43aa77)]">
                    이렇게 고쳐요
                  </p>
                  <GuideTable table={ex.good} tone="good" />
                </div>
              </div>
              <p className="mt-4 text-[13px] leading-[1.7] text-[color:var(--c-text-4a5272)]">
                {ex.how}
              </p>
              <p className="mt-1 text-[12px] leading-[1.7] text-[color:var(--c-text-7b8497)]">
                {ex.autoFix ??
                  "자동으로 찾아 주지는 못해요. 데이터 확인 단계의 표나 편집 화면의 데이터셋 탭에서 직접 지워 주세요."}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 flex flex-col gap-6">
        <div>
          <div className={eyebrow}>BY CHART</div>
          <h2 className="mt-2 text-[26px] font-light tracking-[-0.02em]">
            차트마다 필요한 모양
          </h2>
        </div>
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="bg-[color:var(--c-bg-fafafc)] text-[color:var(--c-text-7b8497)]">
                <th className="px-4 py-3 font-medium">차트</th>
                <th className="px-4 py-3 font-medium">필요한 표 모양</th>
                <th className="px-4 py-3 font-medium">
                  이런 데이터에 어울려요
                </th>
              </tr>
            </thead>
            <tbody>
              {CHARTS.map((c) => {
                const need = CHART_NEEDS[c.type] ?? DEFAULT_NEED;
                return (
                  <tr
                    key={c.type}
                    className="border-t border-[color:var(--c-border-e3e6f0)] align-top"
                  >
                    <th className="whitespace-nowrap px-4 py-3 font-bold">
                      {c.type}
                    </th>
                    <td className="px-4 py-3 leading-[1.7] text-[color:var(--c-text-4a5272)]">
                      {need.shape}
                    </td>
                    <td className="px-4 py-3 leading-[1.7] text-[color:var(--c-text-7b8497)]">
                      {need.example}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 flex flex-col gap-6">
        <div>
          <div className={eyebrow}>SAMPLES</div>
          <h2 className="mt-2 text-[26px] font-light tracking-[-0.02em]">
            샘플 파일 내려받기
          </h2>
          <p className="mt-2 text-[14px] text-[color:var(--c-text-4a5272)]">
            그대로 올려 보거나, 내 데이터를 채워 넣는 양식으로 쓰세요.
          </p>
        </div>
        <SampleDownloads />
      </section>

      <section className="mt-16 flex flex-col gap-6">
        <div>
          <div className={eyebrow}>AI PROMPT</div>
          <h2 className="mt-2 text-[26px] font-light tracking-[-0.02em]">
            표 정리를 AI에게 맡기기
          </h2>
          <p className="mt-2 max-w-[680px] text-[14px] leading-[1.8] text-[color:var(--c-text-4a5272)]">
            표가 복잡하면 AI 챗봇(ChatGPT, Claude 등)이 대신 정리해 줄 수
            있어요. 아래 프롬프트를 복사해서 AI에 붙여넣고, 맨 아래에 내
            데이터를 붙여넣거나 파일을 첨부하세요.
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            "아래에서 만들 차트를 고르고 “프롬프트 복사”를 눌러요.",
            "AI 챗봇에 붙여넣고, 맨 아래 칸에 내 원본 데이터를 넣어요.",
            "AI가 준 CSV를 .csv 파일로 저장(또는 엑셀에 붙여넣기)해서 스튜디오에 올려요.",
          ].map((t, i) => (
            <li
              key={t}
              className={`${card} flex gap-3 p-4 text-[13px] leading-[1.7] text-[color:var(--c-text-4a5272)]`}
            >
              <span className="font-mono text-[12px] text-[color:var(--c-text-2f66f5)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {t}
            </li>
          ))}
        </ol>
        <PromptCopier chartTypes={CHARTS.map((c) => c.type)} />
        <p className="flex items-start gap-2 rounded-lg border border-[color:var(--c-border-f97316)] px-4 py-3 text-[12px] leading-[1.7] text-[color:var(--c-text-4a5272)]">
          <ShieldAlert
            size={16}
            className="mt-0.5 shrink-0 text-[color:var(--c-text-c2410c)]"
            aria-hidden="true"
          />
          AI에 붙여넣은 데이터는 MAC Studio가 아니라 그 AI 서비스로 전송돼요.
          이름, 연락처 같은 개인정보나 외부에 공개하면 안 되는 자료는 지우고
          사용하세요.
        </p>
      </section>
    </main>
  );
}
