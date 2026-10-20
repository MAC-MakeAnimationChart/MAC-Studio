export type Dataset = {
  name: string;
  headers: string[];
  rows: string[][];
};

export const sampleDataset: Dataset = {
  name: "marketing_data.csv",
  headers: ["월", "방문자", "전환수"],
  rows: [
    ["1월", "1200", "90"],
    ["2월", "1850", "140"],
    ["3월", "1500", "110"],
    ["4월", "2300", "210"],
    ["5월", "2100", "180"],
    ["6월", "2900", "260"],
  ],
};

export function parseCsv(text: string, name: string): Dataset {
  const src = text.replace(/^﻿/, "");
  const delimiter = detectDelimiter(src);
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      records.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    records.push(row);
  }

  return recordsToDataset(records, name);
}

// Excel in some regions saves CSV with ";" or tabs instead of commas.
function detectDelimiter(src: string) {
  const first = src.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  let best = ",";
  let bestCount = first.split(",").length - 1;
  for (const d of ["\t", ";"]) {
    const n = first.split(d).length - 1;
    if (n > bestCount) {
      best = d;
      bestCount = n;
    }
  }
  return best;
}

export type Encoding = "utf-8" | "cp949";

// Korean CSVs saved from Excel are often CP949 (EUC-KR), not UTF-8. Try strict UTF-8 first and
// fall back to CP949 so the Korean text doesn't turn into garbage.
export function decodeText(buf: ArrayBuffer): {
  text: string;
  encoding: Encoding;
} {
  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(buf),
      encoding: "utf-8",
    };
  } catch {
    return { text: new TextDecoder("euc-kr").decode(buf), encoding: "cp949" };
  }
}

export function recordsToDataset(records: string[][], name: string): Dataset {
  const nonEmpty = records.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length < 2)
    throw new Error(
      "데이터가 부족해요. 헤더와 한 줄 이상의 데이터가 필요합니다.",
    );

  const [headers, ...rows] = nonEmpty.map((r) => r.map((c) => c.trim()));
  return { name, headers, rows };
}

export function numericColumns(ds: Dataset): number[] {
  return ds.headers
    .map((_, i) => i)
    .filter(
      (i) =>
        i > 0 &&
        ds.rows.some((r) => (r[i] ?? "") !== "") &&
        ds.rows.every(
          (r) =>
            (r[i] ?? "") === "" ||
            !Number.isNaN(Number(r[i].replace(/,/g, ""))),
        ),
    );
}

export function toNumber(v: string | undefined): number {
  const n = Number((v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
