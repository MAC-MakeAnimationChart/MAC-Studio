"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Trash2 } from "lucide-react";
import { ChartView } from "@/components/charts/chart-view";
import { useUser } from "@/lib/auth";
import { loadDataset, openWorkspace } from "@/lib/workspace";
import {
  MEMBER_STORAGE_MB,
  sizeOf,
  useSaved,
  writeSaved,
  type ChartSpec,
  type SavedDataset,
} from "@/lib/saved";

const card =
  "rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] shadow-[0_8px_30px_rgba(37,52,89,0.03)]";

export default function MyPage() {
  const user = useUser();
  const saved = useSaved(user);
  const router = useRouter();

  if (!user) {
    return (
      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10 lg:px-12">
        <div
          className={`${card} flex flex-col items-center gap-3 px-6 py-14 text-center`}
        >
          <p className="text-[14px] font-bold">
            로그인하면 저장한 데이터셋과 차트를 볼 수 있어요
          </p>
          <div className="mt-2 flex gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-[color:var(--c-border-e4e7ee)] px-5 py-2.5 text-[12px] font-bold text-[color:var(--c-text-667087)] hover:bg-[color:var(--c-bg-fafbfc)]"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[color:var(--c-bg-2f66f5)] px-5 py-2.5 text-[12px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)]"
            >
              회원가입
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const write = (next: SavedDataset[]) => writeSaved(user, next);

  const editChart = (s: SavedDataset, chart: ChartSpec) => {
    openWorkspace(s.dataset, chart, s.id);
    router.push("/studio/loading");
  };

  const newChart = (s: SavedDataset) => {
    loadDataset(s.dataset, s.id);
    router.push("/studio");
  };

  const removeFolder = (s: SavedDataset) => {
    if (
      !window.confirm(
        `"${s.name}" 폴더와 안의 차트를 모두 삭제할까요? 되돌릴 수 없어요.`,
      )
    )
      return;
    write(saved.filter((x) => x.id !== s.id));
  };

  const removeChart = (s: SavedDataset, chartId: string) => {
    write(
      saved.map((x) =>
        x.id === s.id
          ? { ...x, charts: x.charts.filter((c) => c.id !== chartId) }
          : x,
      ),
    );
  };

  const used = sizeOf(saved);
  const usedMb = (used / 1024 / 1024).toFixed(used < 1024 * 1024 ? 2 : 1);

  return (
    <section className="mx-auto max-w-[1240px] px-6 pb-16 pt-10 sm:px-10 lg:px-12">
      <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em]">
            마이페이지
          </h1>
          <p className="mt-2 text-[13px] text-[color:var(--c-text-7b8497)]">
            {user} · 데이터셋 폴더 아래에 저장한 차트들을 모아 볼 수 있어요.
          </p>
        </div>
        <div className="rounded-full border border-[color:var(--c-border-e3e7f0)] bg-[color:var(--c-bg-ffffff)] px-3.5 py-2 text-[11px] text-[color:var(--c-text-7b8497)] shadow-sm">
          저장 공간 {usedMb} / {MEMBER_STORAGE_MB} MB
        </div>
      </div>

      {saved.length === 0 ? (
        <div
          className={`${card} flex flex-col items-center gap-3 px-6 py-14 text-center`}
        >
          <p className="text-[13px] font-bold">아직 저장한 내용이 없어요</p>
          <p className="text-[12px] text-[color:var(--c-text-99a1b1)]">
            스튜디오에서 차트를 만들고 마지막 단계에서 저장해 보세요.
          </p>
          <Link
            href="/studio"
            className="mt-2 rounded-lg bg-[color:var(--c-bg-2f66f5)] px-5 py-2.5 text-[12px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)]"
          >
            스튜디오로 이동
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {saved.map((s) => (
            <div key={s.id} className={`${card} p-5 sm:p-6`}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[color:var(--c-bg-eaf0ff)] text-[color:var(--c-text-2f66f5)]">
                    <FolderOpen size={19} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold">{s.name}</h2>
                    <p className="mt-0.5 text-[11px] text-[color:var(--c-text-99a1b1)]">
                      {s.date} 저장 · {s.dataset.rows.length}행 ·{" "}
                      {s.dataset.headers.length}열 · 차트 {s.charts.length}개
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => newChart(s)}
                    className="rounded-lg bg-[color:var(--c-bg-2f66f5)] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)]"
                  >
                    이 데이터셋으로 새 차트
                  </button>
                  <button
                    onClick={() => removeFolder(s)}
                    className="rounded-lg p-2 text-[color:var(--c-text-9da5b5)] hover:bg-[color:var(--c-bg-f5f6fa)]"
                    aria-label="폴더 삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {s.charts.length === 0 ? (
                <p className="rounded-lg bg-[color:var(--c-bg-fafafc)] px-4 py-6 text-center text-[12px] text-[color:var(--c-text-99a1b1)]">
                  이 폴더에 남은 차트가 없어요.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {s.charts.map((c) => (
                    <div
                      key={c.id}
                      className="group rounded-lg border border-[color:var(--c-border-edf0f5)] p-3"
                    >
                      <div className="overflow-hidden rounded-lg border border-[color:var(--c-border-edf0f5)]">
                        <ChartView dataset={s.dataset} spec={c} />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="text-[12px] font-bold">
                          {c.title || c.type}{" "}
                          <span className="ml-1 text-[10px] font-semibold text-[color:var(--c-text-9ca4b4)]">
                            {c.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => editChart(s, c)}
                            className="rounded-md px-2 py-1 text-[11px] font-bold text-[color:var(--c-text-2f66f5)] hover:bg-[color:var(--c-bg-eaf0ff)]"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => removeChart(s, c.id)}
                            className="rounded-md p-1.5 text-[color:var(--c-text-9da5b5)] hover:bg-[color:var(--c-bg-f5f6fa)]"
                            aria-label="차트 삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
