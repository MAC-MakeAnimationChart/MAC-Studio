"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Pencil, Save } from "lucide-react";
import { useAuthModal } from "@/components/auth-modal";
import { ChartOptionsPanel } from "@/components/chart-options-panel";
import { ChartView } from "@/components/charts/chart-view";
import { getChart } from "@/components/charts/registry";
import { DataGrid } from "@/components/data-grid";
import { ExportMenu } from "@/components/export-menu";
import { useLeaveGuard } from "@/components/leave-guard";
import { useUser } from "@/lib/auth";
import { deepEqual } from "@/lib/deep-equal";
import { MEMBER_STORAGE_MB } from "@/lib/limits";
import {
  newId,
  overStorageLimit,
  today,
  upsertSaved,
  useSaved,
  writeSaved,
} from "@/lib/saved";
import {
  hydrateWorkspace,
  replaceDataset,
  setFolderId,
  setUnsaved,
  updateChart,
  useWorkspace,
} from "@/lib/workspace";

const AUTOSAVE_MS = 5 * 60 * 1000;
const SAVE_COOLDOWN_MS = 10 * 1000;

const card =
  "rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] shadow-[0_8px_30px_rgba(37,52,89,0.03)]";

// Keeps long dataset names from stretching the toast.
const shorten = (text: string, max = 36) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

const clock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function EditorPage() {
  const user = useUser();
  const saved = useSaved(user);
  const { dataset, chart, folderId, origin, hydrated } = useWorkspace();

  const [tab, setTab] = useState<"chart" | "data">("chart");
  const [panelOpen, setPanelOpen] = useState(true);
  const [savedAt, setSavedAt] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const saveRef = useRef<(auto: boolean) => void>(() => {});
  const router = useRouter();
  const openAuth = useAuthModal();

  useEffect(() => {
    hydrateWorkspace();
  }, []);

  // The folder this work is saved in (by id once saved, otherwise by dataset name).
  const existing = dataset
    ? (saved.find((s) => s.id === folderId) ??
      saved.find((s) => s.name === dataset.name))
    : undefined;
  const existingDataset = existing?.dataset;
  const savedChart = existing?.charts.find((c) => c.id === chart?.id);
  const datasetSame = useMemo(
    () => !!dataset && !!existingDataset && deepEqual(dataset, existingDataset),
    [dataset, existingDataset],
  );
  const chartSame = useMemo(
    () => !!chart && !!savedChart && deepEqual(chart, savedChart),
    [chart, savedChart],
  );
  // Unsaved = differs from what is stored (or was never stored). Only members can save.
  const dirty = !!user && !!dataset && !!chart && !(datasetSame && chartSame);

  // Saves this chart under its dataset folder; returns true if it was saved.
  // Nothing is written when nothing changed. When a backend is connected, the request to it
  // belongs right here, after this check, so unchanged work never reaches the server.
  const performSave = (auto: boolean): boolean => {
    if (!user || !dataset || !chart || !dirty) return false;
    if (saved.some((s) => s.name === dataset.name && s.id !== existing?.id)) {
      toast.error("같은 이름의 폴더가 이미 있어요", {
        id: "save-error",
        duration: 8000,
        description: "데이터셋 이름을 바꿔 주세요.",
      });
      return false;
    }
    // The dataset is the folder; this chart is added under it (or updated if it was opened from it).
    const prev = existing?.charts ?? [];
    const charts = prev.some((c) => c.id === chart.id)
      ? prev.map((c) => (c.id === chart.id ? chart : c))
      : [...prev, chart];
    const id = existing?.id ?? newId();
    const list = upsertSaved(saved, {
      id,
      name: dataset.name,
      date: today(),
      dataset,
      charts,
    });
    if (overStorageLimit(list)) {
      toast.error(`저장 공간(${MEMBER_STORAGE_MB} MB)을 넘어요`, {
        id: "save-error",
        duration: 8000,
        description: "마이페이지에서 안 쓰는 폴더를 지워 주세요.",
      });
      return false;
    }
    if (!writeSaved(user, list)) {
      toast.error("브라우저에 저장하지 못했어요", {
        id: "save-error",
        duration: 8000,
      });
      return false;
    }
    setFolderId(id);
    toast.dismiss("save-error");
    setSavedAt(clock());
    if (!auto) {
      setCooldownUntil(Date.now() + SAVE_COOLDOWN_MS);
      setNow(Date.now());
      toast.success("차트를 저장했어요", {
        id: "saved",
        duration: 2800,
        description: `${shorten(dataset.name)} 폴더 · ${shorten(chart.title || chart.type)}`,
        action: { label: "마이페이지", onClick: () => router.push("/mypage") },
      });
    }
    return true;
  };

  useEffect(() => {
    saveRef.current = (auto) => {
      performSave(auto);
    };
  });

  // Tell the rest of the app (the logout button) when there is something unsaved.
  useEffect(() => {
    setUnsaved(dirty);
    return () => setUnsaved(false);
  }, [dirty]);

  // Counts down the save button's cooldown.
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= cooldownUntil) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const { dialog: leaveDialog } = useLeaveGuard({
    dirty,
    onSave: () => performSave(false),
  });

  // Members get an automatic save every 5 minutes, and one whenever the tab is hidden or closed,
  // since all the work lives in this browser tab.
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => saveRef.current(true), AUTOSAVE_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") saveRef.current(true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [user]);

  if (!hydrated)
    return (
      <main className="px-6 py-20 text-center text-[13px] text-[color:var(--c-text-99a1b1)]">
        불러오는 중…
      </main>
    );

  if (!dataset || !chart) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-20">
        <div
          className={`${card} flex flex-col items-center gap-3 px-6 py-12 text-center`}
        >
          <p className="text-[14px] font-bold">
            {dataset ? "선택한 차트가 없어요" : "편집할 데이터셋이 없어요"}
          </p>
          <p className="text-[12px] text-[color:var(--c-text-99a1b1)]">
            먼저 데이터를 업로드하고 차트를 하나 선택해 주세요.
          </p>
          <Link
            href="/studio"
            className="mt-2 rounded-lg bg-[color:var(--c-bg-2f66f5)] px-5 py-2.5 text-[12px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)]"
          >
            스튜디오로 이동
          </Link>
        </div>
      </main>
    );
  }

  const def = getChart(chart.type);
  const base = (
    chart.title ||
    dataset.headers[chart.valueCol] ||
    dataset.name
  ).replace(/[\\/:*?"<>|]/g, "_");

  const cooling = cooldownUntil > now;
  const cooldownLeft = Math.max(1, Math.ceil((cooldownUntil - now) / 1000));

  const startRename = () => {
    setDraftName(dataset.name);
    setEditingName(true);
  };
  const commitRename = () => {
    const next = draftName.trim();
    if (next && next !== dataset.name)
      replaceDataset({ ...dataset, name: next });
    setEditingName(false);
  };

  return (
    <main className="px-3 pb-16 pt-6 text-[color:var(--c-text-0c1b4c)] sm:px-4">
      {leaveDialog}
      <div className="mb-5 grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={origin === "mypage" ? "/mypage" : "/studio"}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[color:var(--c-border-e4e7ee)] bg-[color:var(--c-bg-ffffff)] px-3 py-2 text-[12px] font-bold text-[color:var(--c-text-667087)] hover:bg-[color:var(--c-bg-fafbfc)]"
          >
            <ArrowLeft size={14} />{" "}
            {origin === "mypage" ? "마이페이지로 돌아가기" : "차트 다시 선택"}
          </Link>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                autoFocus
                value={draftName}
                maxLength={120}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingName(false);
                }}
                aria-label="데이터셋 이름"
                className="w-full rounded-md border border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-ffffff)] px-2 py-1 text-[14px] font-bold outline-none"
              />
            ) : (
              <button
                onClick={startRename}
                title={`${dataset.name}\n클릭해서 이름 변경`}
                aria-label={`데이터셋 이름: ${dataset.name}. 클릭해서 이름 변경`}
                className="group flex w-full min-w-0 items-center gap-1.5 text-left"
              >
                <span className="truncate text-[14px] font-bold">
                  {dataset.name}
                </span>
                <Pencil
                  size={12}
                  className="shrink-0 text-[color:var(--c-text-9aa1b8)] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
                />
              </button>
            )}
            <div className="truncate text-[11px] text-[color:var(--c-text-99a1b1)]">
              {dataset.rows.length}행 · {chart.type}
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="보기 전환"
          className="flex justify-self-center rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-1"
        >
          {(
            [
              ["chart", "차트"],
              ["data", "데이터셋"],
            ] as const
          ).map(([key, text]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-6 py-2 text-[13px] font-bold transition ${tab === key ? "bg-[color:var(--c-bg-2f66f5)] text-white shadow-sm" : "text-[color:var(--c-text-7b8497)] hover:bg-[color:var(--c-bg-f6f7fb)]"}`}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {user && (
            <span
              className="mr-1 text-[11px] text-[color:var(--c-text-99a1b1)]"
              aria-live="polite"
            >
              {dirty
                ? "저장되지 않은 변경 사항 · 5분마다 자동 저장"
                : savedAt
                  ? `${savedAt} 저장됨`
                  : "변경 사항 없음"}
            </span>
          )}
          <ExportMenu
            getSvg={() => box.current?.querySelector("svg") ?? null}
            dataset={dataset}
            baseName={base}
          />
          {user ? (
            <button
              onClick={() => performSave(false)}
              disabled={!dirty || cooling}
              className="flex items-center gap-1.5 rounded-lg bg-[color:var(--c-bg-2f66f5)] px-4 py-2 text-[12px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)] disabled:cursor-not-allowed disabled:bg-[color:var(--c-bg-e3e6f0)] disabled:text-[color:var(--c-text-7b8497)] disabled:hover:bg-[color:var(--c-bg-e3e6f0)]"
            >
              {!dirty ? (
                <>
                  <Check size={14} /> 저장됨
                </>
              ) : cooling ? (
                <>
                  <Save size={14} /> {cooldownLeft}초 후 저장 가능
                </>
              ) : (
                <>
                  <Save size={14} /> 저장
                </>
              )}
            </button>
          ) : (
            <div className="rounded-lg bg-[color:var(--c-bg-fafafc)] px-3 py-2 text-[11px] text-[color:var(--c-text-7b8497)]">
              저장은 회원 전용 ·{" "}
              <button
                onClick={() => openAuth("signup")}
                className="font-bold text-[color:var(--c-text-2f66f5)] hover:underline"
              >
                회원가입
              </button>
            </div>
          )}
        </div>
      </div>

      {tab === "chart" && (
        <div
          className={`grid items-start gap-4 ${panelOpen ? "lg:grid-cols-[minmax(0,1fr)_clamp(240px,17vw,300px)]" : ""}`}
        >
          <div className={`${card} relative p-3`}>
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className="absolute right-4 top-4 z-10 hidden rounded-lg border border-[color:var(--c-border-e4e7ee)] bg-[color:var(--c-bg-ffffff)]/90 px-2.5 py-1.5 text-[11px] font-bold text-[color:var(--c-text-667087)] hover:bg-[color:var(--c-bg-ffffff)] lg:block"
            >
              {panelOpen ? "옵션 접기 ▸" : "◂ 옵션 열기"}
            </button>
            <div
              ref={box}
              className="overflow-hidden rounded-lg border border-[color:var(--c-border-edf0f5)]"
            >
              <ChartView dataset={dataset} spec={chart} />
            </div>
          </div>

          <aside
            className={`${card} flex-col p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto ${panelOpen ? "flex" : "flex lg:hidden"}`}
            aria-label="차트 옵션"
          >
            <h2 className="mb-3 text-[14px] font-bold">차트 옵션</h2>
            <ChartOptionsPanel
              spec={chart}
              dataset={dataset}
              def={def}
              onChange={updateChart}
            />
          </aside>
        </div>
      )}

      {tab === "data" && (
        <div className={`${card} p-4 sm:p-6`}>
          <DataGrid
            dataset={dataset}
            spec={chart}
            onDataset={replaceDataset}
            onSpec={updateChart}
          />
        </div>
      )}
    </main>
  );
}
