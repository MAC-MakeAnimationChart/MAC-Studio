import { ApiError, api, isMock } from './api-client'
import { FIGURE_SCHEMA_VERSION, type ChartSpec } from './chart-spec'
import type { Dataset } from './csv'
import { toast } from 'sonner'
import { readSaved, writeSaved, type FolderSync } from './saved'

// Sends saved work to the backend (MAC-BE: POST /datasets, PATCH /datasets/{id}, PATCH /charts/{id}).
// The local copy stays the source for the screens (the backend has no list / get / delete yet), so
// this only mirrors what was saved. Every call is skipped in mock mode. See docs/BE_INTEGRATION.md §7.
//
// Contract notes:
//  - create and chart updates are multipart: a JSON `command` part (and an optional `thumbnail` part)
//  - create needs an Idempotency-Key; updates carry `expectedRevision` (a string) and return the next one
//  - the backend only creates a chart together with a new dataset, so a second chart in the same
//    folder cannot be sent yet

export type SyncOutcome =
  | { ok: true; sync: FolderSync }
  | { ok: false; reason: 'invalid' | 'unsupported' | 'conflict' | 'failed'; message: string }

type Changed = { dataset: boolean; chart: boolean }

// Same retry of the same save reuses its key, so a lost response cannot create the folder twice.
const idempotencyKeys = new Map<string, string>()

// One request at a time: each update needs the revision the previous one returned.
let queue: Promise<unknown> = Promise.resolve()

export function syncFolder(
  folderId: string,
  dataset: Dataset,
  chart: ChartSpec,
  // read when the turn comes, not when asked: an earlier queued save may have changed the revisions
  getCurrent: () => FolderSync | undefined,
  changed: Changed,
): Promise<SyncOutcome> {
  const run = queue.then(() => doSync(folderId, dataset, chart, getCurrent(), changed))
  queue = run.catch(() => {})
  return run
}

// Fire-and-forget after a local save: sends the change, then records the new ids/revisions on the
// local folder. A failure never undoes the local save; it only tells the user (once per kind).
export function mirrorToServer(
  user: string,
  folderId: string,
  dataset: Dataset,
  chart: ChartSpec,
  datasetChanged: boolean,
  chartChanged: boolean,
  auto: boolean,
) {
  const getCurrent = () => readSaved(user).find((f) => f.id === folderId)?.sync
  void syncFolder(folderId, dataset, chart, getCurrent, { dataset: datasetChanged, chart: chartChanged }).then((res) => {
    if (res.ok) {
      writeSaved(
        user,
        readSaved(user).map((f) => (f.id === folderId ? { ...f, sync: res.sync } : f)),
      )
      toast.dismiss('sync-error')
      return
    }
    // "not supported yet" repeats on every autosave, so it is only shown for a deliberate save
    if (res.reason === 'unsupported' && auto) return
    toast.warning(res.message, { id: 'sync-error', duration: 8000 })
  })
}

const jsonPart =(value: unknown) => new Blob([JSON.stringify(value)], { type: 'application/json' })

// The backend refuses tables it cannot store, so say so before sending.
export function datasetProblem(ds: Dataset): string | null {
  if (ds.name !== ds.name.trim() || ds.name.length === 0 || ds.name.length > 120) return '데이터셋 이름은 앞뒤 공백 없이 120자 이하여야 해요.'
  const names = new Set<string>()
  for (const h of ds.headers) {
    if (!h.trim() || names.has(h)) return '서버에 저장하려면 열 이름이 비어 있거나 겹치면 안 돼요.'
    names.add(h)
  }
  return null
}

async function doSync(folderId: string, dataset: Dataset, chart: ChartSpec, current: FolderSync | undefined, changed: Changed): Promise<SyncOutcome> {
  if (isMock) return { ok: false, reason: 'failed', message: 'mock' }
  const problem = datasetProblem(dataset)
  if (problem) return { ok: false, reason: 'invalid', message: problem }
  const data = { headers: dataset.headers, rows: dataset.rows }
  const title = (chart.title ?? '').trim()
  try {
    if (!current) {
      const key = idempotencyKeys.get(folderId) ?? crypto.randomUUID()
      idempotencyKeys.set(folderId, key)
      const form = new FormData()
      form.append(
        'command',
        jsonPart({
          name: dataset.name,
          dataSchemaVersion: 1,
          data,
          firstChart: { title, chartType: chart.type, figureSchemaVersion: FIGURE_SCHEMA_VERSION, figure: chart },
        }),
      )
      const r = await api<{ datasetId: string; datasetRevision: string; chartId: string; chartRevision: string }>('/datasets', {
        body: form,
        headers: { 'Idempotency-Key': key },
      })
      idempotencyKeys.delete(folderId)
      return { ok: true, sync: { datasetId: r.datasetId, datasetRevision: r.datasetRevision, charts: { [chart.id]: { id: r.chartId, revision: r.chartRevision } } } }
    }

    const next: FolderSync = { ...current, charts: { ...current.charts } }
    const serverChart = current.charts[chart.id]
    if (changed.chart && !serverChart) return { ok: false, reason: 'unsupported', message: '서버에는 아직 폴더의 첫 차트만 저장할 수 있어요. 이 기기에는 저장했어요.' }
    if (changed.dataset) {
      const r = await api<{ datasetRevision: string }>(`/datasets/${current.datasetId}`, {
        method: 'PATCH',
        body: { expectedRevision: current.datasetRevision, name: dataset.name, dataSchemaVersion: 1, data },
      })
      next.datasetRevision = r.datasetRevision
    }
    if (changed.chart && serverChart) {
      const form = new FormData()
      form.append(
        'command',
        jsonPart({ expectedRevision: serverChart.revision, title, chartType: chart.type, figureSchemaVersion: FIGURE_SCHEMA_VERSION, figure: chart }),
      )
      const r = await api<{ chartRevision: string; datasetRevision: string }>(`/charts/${serverChart.id}`, { method: 'PATCH', body: form })
      next.charts[chart.id] = { id: serverChart.id, revision: r.chartRevision }
      // a chart update also reports the dataset's revision
      if (r.datasetRevision) next.datasetRevision = r.datasetRevision
    }
    return { ok: true, sync: next }
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) return { ok: false, reason: 'conflict', message: '다른 곳에서 먼저 저장한 내용이 있어요. 이 기기에는 저장했어요.' }
    return { ok: false, reason: 'failed', message: e instanceof Error ? e.message : '서버에 저장하지 못했어요.' }
  }
}
