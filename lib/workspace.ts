import { useSyncExternalStore } from "react";
import {
  autoTitle,
  createChartSpec,
  defaultLegend,
  normalizeChart,
  type ChartSpec,
} from "./chart-spec";
import type { Dataset } from "./csv";
import { newId } from "./saved";

// The studio's working state lives entirely in the browser: an in-memory store shared by the
// /studio and /studio/editor pages, mirrored to sessionStorage (best effort) so a refresh
// keeps small files. Nothing is sent to a server. One session edits exactly one chart.
// Where the user came from, so the editor's back button goes to the right place.
export type Origin = "studio" | "mypage";

// `folderId` is the saved folder this work belongs to (null until it is saved or opened from one).
type Workspace = {
  dataset: Dataset | null;
  chart: ChartSpec | null;
  folderId: string | null;
  origin: Origin;
  hydrated: boolean;
  unsaved: boolean;
};

const EMPTY: Workspace = {
  dataset: null,
  chart: null,
  folderId: null,
  origin: "studio",
  hydrated: false,
  unsaved: false,
};
const KEY = "mac-studio:workspace:v2";

let state: Workspace = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    if (state.dataset)
      sessionStorage.setItem(
        KEY,
        JSON.stringify({
          dataset: state.dataset,
          chart: state.chart,
          folderId: state.folderId,
          origin: state.origin,
        }),
      );
    else sessionStorage.removeItem(KEY);
  } catch {
    // too large for sessionStorage or storage blocked: the in-memory copy still works
  }
}

function set(next: Partial<Workspace>) {
  state = { ...state, ...next };
  persist();
  emit();
}

export function useWorkspace(): Workspace {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => EMPTY,
  );
}

// Call once from an effect after mount, so server and client render the same first frame.
export function hydrateWorkspace() {
  if (state.hydrated) return;
  let restored: Partial<Workspace> = {};
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw && !state.dataset) {
      const parsed = JSON.parse(raw);
      restored = {
        dataset: parsed.dataset ?? null,
        chart: parsed.chart ? normalizeChart(parsed.chart) : null,
        folderId: parsed.folderId ?? null,
        origin: parsed.origin === "mypage" ? "mypage" : "studio",
      };
    }
  } catch {
    // ignore unreadable storage
  }
  state = { ...state, ...restored, hydrated: true };
  emit();
}

export function loadDataset(dataset: Dataset, folderId: string | null = null) {
  set({ dataset, chart: null, folderId, origin: "studio" });
}

// Opens a saved chart from the mypage, so the editor's back button returns there.
export function openWorkspace(
  dataset: Dataset,
  chart: ChartSpec | null,
  folderId: string | null = null,
) {
  set({ dataset, chart, folderId, origin: "mypage" });
}

export function setFolderId(folderId: string | null) {
  set({ folderId });
}

export function replaceDataset(dataset: Dataset) {
  set({ dataset });
}

// Picking a chart type creates the one chart for this session, with the conversion defaults
// (see createChartSpec). Changing the type is only possible here, before the editor opens.
export function selectChart(type: string) {
  const { dataset, chart } = state;
  if (!dataset) return;
  if (chart?.type === type) return;
  if (chart)
    return set({ chart: { ...chart, type, legend: defaultLegend(type) } });
  set({ chart: createChartSpec(newId(), type, dataset) });
}

export function updateChart(spec: ChartSpec) {
  const { dataset, chart } = state;
  if (!chart) return;
  // keep the auto title in sync with the chosen columns until the user edits it
  const followsColumns =
    dataset &&
    chart.title === autoTitle(dataset, chart.labelCol, chart.valueCol);
  const columnsChanged =
    spec.valueCol !== chart.valueCol || spec.labelCol !== chart.labelCol;
  const title =
    dataset && followsColumns && columnsChanged
      ? autoTitle(dataset, spec.labelCol, spec.valueCol)
      : spec.title;
  set({ chart: { ...spec, id: chart.id, title } });
}

// Lets other parts of the app (e.g. the header's logout) know the editor has unsaved changes.
// Not persisted: it only describes the page that is open right now.
export function setUnsaved(unsaved: boolean) {
  if (state.unsaved === unsaved) return;
  state = { ...state, unsaved };
  emit();
}
