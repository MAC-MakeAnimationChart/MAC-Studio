"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ChartView } from "@/components/charts/chart-view";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // the delete the user has asked for but not yet confirmed
  const [pending, setPending] = useState<
    | { kind: "folder"; folderId: string }
    | { kind: "chart"; folderId: string; chartId: string }
    | null
  >(null);

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
    write(saved.filter((x) => x.id !== s.id));
    toast.success("데이터셋을 삭제했어요", { id: "mypage-delete" });
  };

  const removeChart = (s: SavedDataset, chartId: string) => {
    write(
      saved.map((x) =>
        x.id === s.id
          ? { ...x, charts: x.charts.filter((c) => c.id !== chartId) }
          : x,
      ),
    );
    toast.success("차트를 삭제했어요", { id: "mypage-delete" });
  };

  // what the open question is about (it may be gone if the list changed meanwhile)
  const pendingFolder = pending
    ? saved.find((x) => x.id === pending.folderId)
    : undefined;
  const pendingChart =
    pending?.kind === "chart"
      ? pendingFolder?.charts.find((c) => c.id === pending.chartId)
      : undefined;
  const closeConfirm = () => setPending(null);

  const used = sizeOf(saved);
  const usedMb = (used / 1024 / 1024).toFixed(used < 1024 * 1024 ? 2 : 1);
  const usedPct = Math.min(
    100,
    Math.round((used / (MEMBER_STORAGE_MB * 1024 * 1024)) * 100),
  );
  const chartCount = saved.reduce((n, s) => n + s.charts.length, 0);

  const q = query.trim().toLowerCase();
  const visible = q
    ? saved.filter((s) => s.name.toLowerCase().includes(q))
    : saved;
  // the open folder; falls back to the first one when nothing is picked or it was deleted
  const current = visible.find((s) => s.id === pickedId) ?? visible[0] ?? null;

  const stat = (label: string, value: string) => (
    <div className={`${card} px-5 py-4`}>
      <div className="text-[11px] text-[color:var(--c-text-99a1b1)]">
        {label}
      </div>
      <div className="mt-1 text-[22px] font-bold tracking-[-0.02em]">
        {value}
      </div>
    </div>
  );

  return (
    <section className="mx-auto max-w-[1240px] px-6 pb-16 pt-10 sm:px-10 lg:px-12">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-[-0.03em]">마이페이지</h1>
        <p className="mt-2 text-[13px] text-[color:var(--c-text-7b8497)]">
          {user} · 데이터셋 폴더 아래에 저장한 차트들을 모아 볼 수 있어요.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {stat("데이터셋", `${saved.length}개`)}
        {stat("차트", `${chartCount}개`)}
        <div className={`${card} px-5 py-4`}>
          <div className="flex items-baseline justify-between text-[11px] text-[color:var(--c-text-99a1b1)]">
            <span>저장 공간</span>
            <span>
              {usedMb} / {MEMBER_STORAGE_MB} MB
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="저장 공간 사용량"
            aria-valuenow={usedPct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 h-2 overflow-hidden rounded-full bg-[color:var(--c-bg-f1f3f9)]"
          >
            <div
              className="h-full rounded-full bg-[color:var(--c-bg-2f66f5)]"
              style={{ width: `${Math.max(usedPct, used > 0 ? 2 : 0)}%` }}
            />
          </div>
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
        <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            aria-label="데이터셋 폴더"
            className={`${card} flex flex-col p-3 lg:sticky lg:top-24`}
          >
            <div className="relative mb-2">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--c-text-9aa1b8)]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="데이터셋 검색"
                aria-label="데이터셋 검색"
                className="w-full rounded-lg border border-[color:var(--c-border-e4e7ee)] py-2 pl-8 pr-3 text-[12px] outline-none focus:border-[color:var(--c-border-4f7cf5)]"
              />
            </div>
            <ul className="flex max-h-[420px] flex-col gap-1 overflow-y-auto">
              {visible.map((s) => {
                const active = s.id === current?.id;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setPickedId(s.id)}
                      aria-current={active}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${active ? "bg-[color:var(--c-bg-eaf0ff)]" : "hover:bg-[color:var(--c-bg-f6f7fb)]"}`}
                    >
                      <FolderOpen
                        size={16}
                        className={`shrink-0 ${active ? "text-[color:var(--c-text-2f66f5)]" : "text-[color:var(--c-text-9aa1b8)]"}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold">
                          {s.name}
                        </span>
                        <span className="block text-[11px] text-[color:var(--c-text-99a1b1)]">
                          {s.date} · 차트 {s.charts.length}개
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="px-3 py-6 text-center text-[12px] text-[color:var(--c-text-99a1b1)]">
                  검색 결과가 없어요
                </li>
              )}
            </ul>
          </aside>

          {current ? (
            <div className={`${card} p-5 sm:p-6`}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[18px] font-bold">
                    {current.name}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[color:var(--c-text-99a1b1)]">
                    {current.date} 저장 · {current.dataset.rows.length}행 ·{" "}
                    {current.dataset.headers.length}열 · 차트{" "}
                    {current.charts.length}개
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => newChart(current)}
                    className="flex items-center gap-1.5 rounded-lg bg-[color:var(--c-bg-2f66f5)] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)]"
                  >
                    <Plus size={14} /> 새 차트 만들기
                  </button>
                  <button
                    onClick={() =>
                      setPending({ kind: "folder", folderId: current.id })
                    }
                    className="rounded-lg p-2 text-[color:var(--c-text-9da5b5)] hover:bg-[color:var(--c-bg-f5f6fa)]"
                    aria-label="폴더 삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {current.charts.length === 0 ? (
                <p className="rounded-lg bg-[color:var(--c-bg-fafafc)] px-4 py-10 text-center text-[12px] text-[color:var(--c-text-99a1b1)]">
                  이 폴더에 남은 차트가 없어요. 새 차트를 만들어 보세요.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {current.charts.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-[color:var(--c-border-edf0f5)] p-3"
                    >
                      <button
                        onClick={() => editChart(current, c)}
                        aria-label={`${c.title || c.type} 편집`}
                        className="block w-full overflow-hidden rounded-lg border border-[color:var(--c-border-edf0f5)] transition hover:border-[color:var(--c-border-4f7cf5)]"
                      >
                        <ChartView dataset={current.dataset} spec={c} />
                      </button>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 text-[12px] font-bold">
                          <span className="block truncate">
                            {c.title || c.type}
                          </span>
                          <span className="text-[10px] font-semibold text-[color:var(--c-text-9ca4b4)]">
                            {c.type}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => editChart(current, c)}
                            className="rounded-md px-2 py-1 text-[11px] font-bold text-[color:var(--c-text-2f66f5)] hover:bg-[color:var(--c-bg-eaf0ff)]"
                          >
                            편집
                          </button>
                          <button
                            onClick={() =>
                              setPending({
                                kind: "chart",
                                folderId: current.id,
                                chartId: c.id,
                              })
                            }
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
          ) : (
            <div
              className={`${card} px-6 py-14 text-center text-[12px] text-[color:var(--c-text-99a1b1)]`}
            >
              검색 결과가 없어요.
            </div>
          )}
        </div>
      )}

      {pending?.kind === "folder" && pendingFolder && (
        <ConfirmDialog
          title="데이터셋을 삭제할까요?"
          confirmLabel="삭제"
          danger
          onCancel={closeConfirm}
          onConfirm={() => {
            removeFolder(pendingFolder);
            closeConfirm();
          }}
        >
          <b className="break-all">&ldquo;{pendingFolder.name}&rdquo;</b> 폴더와
          안에 저장된 차트 {pendingFolder.charts.length}개가 모두 삭제돼요.
          삭제하면 되돌릴 수 없어요.
        </ConfirmDialog>
      )}
      {pending?.kind === "chart" && pendingFolder && pendingChart && (
        <ConfirmDialog
          title="차트를 삭제할까요?"
          confirmLabel="삭제"
          danger
          onCancel={closeConfirm}
          onConfirm={() => {
            removeChart(pendingFolder, pendingChart.id);
            closeConfirm();
          }}
        >
          <b className="break-all">
            &ldquo;{pendingChart.title || pendingChart.type}&rdquo;
          </b>{" "}
          차트가 삭제돼요. 데이터셋은 그대로 남고, 삭제한 차트는 되돌릴 수
          없어요.
        </ConfirmDialog>
      )}
    </section>
  );
}
