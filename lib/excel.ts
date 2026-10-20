import { recordsToDataset, type Dataset } from './csv'

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return ''
  if (cell instanceof Date) return cell.toLocaleDateString('ko-KR')
  return String(cell)
}

// Reads the first sheet of an .xlsx file. The library is loaded on demand so it
// stays out of the initial bundle.
export async function parseXlsx(file: File): Promise<Dataset> {
  const { readSheet } = await import('read-excel-file/browser')
  const rows = await readSheet(file)
  return recordsToDataset(
    rows.map((r) => r.map(cellToString)),
    file.name,
  )
}
