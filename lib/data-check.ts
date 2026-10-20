import { numericColumns, type Dataset, type Encoding } from "./csv";

export type Level = "error" | "warn" | "info";

export type Fix = {
  label: string;
  // true = safe to run automatically with "추천 고치기 모두 적용"; false = the user must choose it
  auto: boolean;
  apply: (ds: Dataset) => Dataset;
};

export type Issue = {
  id: string;
  level: Level;
  title: string;
  detail: string;
  fix?: Fix;
};

type Meta = { encoding?: Encoding };

const isFilled = (v: string | undefined) => (v ?? "").trim() !== "";
const isNumeric = (v: string) =>
  v.trim() !== "" && !Number.isNaN(Number(v.replace(/,/g, "")));

// "12.5%", "₩1,200", "3,400원", "(500)" ... -> plain number text, or null when it isn't one of those.
const UNIT =
  /^\s*([(\-+−]?)\s*[$₩€£¥]?\s*([\d,]+(?:\.\d+)?)\s*(%|퍼센트|원|달러|명|건|개|배|회|점|km|kg|cm|m|㎡)?\s*\)?\s*$/;
export function cleanNumber(v: string): string | null {
  const m = UNIT.exec(v);
  if (!m) return null;
  const negative =
    m[1] === "-" || m[1] === "−" || (m[1] === "(" && v.trim().endsWith(")"));
  const digits = m[2].replace(/,/g, "");
  if (Number.isNaN(Number(digits))) return null;
  return `${negative ? "-" : ""}${digits}`;
}

// ---- fixes ------------------------------------------------------------------------------

function nameHeaders(ds: Dataset): Dataset {
  const seen = new Map<string, number>();
  const headers = ds.headers.map((h, i) => {
    let name = h.trim() || `열${i + 1}`;
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    if (n > 1) name = `${name} (${n})`;
    return name;
  });
  return { ...ds, headers };
}

function dropEmptyColumns(ds: Dataset): Dataset {
  const keep = ds.headers.map(
    (h, c) => isFilled(h) || ds.rows.some((r) => isFilled(r[c])),
  );
  const pick = <T>(row: T[]) => row.filter((_, c) => keep[c]);
  return { ...ds, headers: pick(ds.headers), rows: ds.rows.map(pick) };
}

function stripUnits(ds: Dataset, cols: number[]): Dataset {
  return {
    ...ds,
    rows: ds.rows.map((r) =>
      r.map((v, c) =>
        cols.includes(c) && !isNumeric(v) ? (cleanNumber(v) ?? v) : v,
      ),
    ),
  };
}

function promoteRowToHeader(ds: Dataset, index: number): Dataset {
  const header = ds.rows[index];
  return {
    ...ds,
    headers: header.map((h) => h.trim()),
    rows: ds.rows.slice(index + 1),
  };
}

function transpose(ds: Dataset): Dataset {
  const all = [ds.headers, ...ds.rows];
  const width = Math.max(...all.map((r) => r.length));
  const t = Array.from({ length: width }, (_, c) => all.map((r) => r[c] ?? ""));
  return { ...ds, headers: t[0], rows: t.slice(1) };
}

function dropRowsWithBlanks(ds: Dataset, cols: number[]): Dataset {
  return {
    ...ds,
    rows: ds.rows.filter((r) => cols.every((c) => isFilled(r[c]))),
  };
}

function addNumberColumn(ds: Dataset): Dataset {
  return {
    ...ds,
    headers: ["번호", ...ds.headers],
    rows: ds.rows.map((r, i) => [String(i + 1), ...r]),
  };
}

// ---- checks -----------------------------------------------------------------------------

const YEAR = /^(19|20)\d{2}\s*(년|\.|-|\/)?\s*\d{0,2}\s*(월)?$/;

export function inspectDataset(ds: Dataset, meta: Meta = {}): Issue[] {
  const issues: Issue[] = [];
  const width = ds.headers.length;
  const numCols = numericColumns(ds);

  if (meta.encoding === "cp949") {
    issues.push({
      id: "encoding",
      level: "info",
      title: "한글 인코딩(CP949)으로 읽었어요",
      detail:
        "엑셀에서 저장한 한글 CSV는 보통 이 방식이에요. 글자가 정상으로 보이면 괜찮아요.",
    });
  }

  if (ds.rows.length === 0) {
    issues.push({
      id: "no-rows",
      level: "error",
      title: "데이터 줄이 없어요",
      detail: "열 이름 줄 아래에 데이터가 한 줄 이상 있어야 해요.",
    });
    return issues;
  }

  // A title or note above the real header row
  const filledCount = (r: string[]) => r.filter(isFilled).length;
  if (width >= 2 && filledCount(ds.headers) <= Math.ceil(width / 2)) {
    const k = ds.rows.findIndex(
      (r) => filledCount(r) >= Math.max(2, Math.ceil(width * 0.8)),
    );
    if (k >= 0 && k < 10) {
      issues.push({
        id: "title-rows",
        level: "warn",
        title: "맨 위에 제목이나 설명 줄이 있는 것 같아요",
        detail: `열 이름이 아닌 줄이 ${k + 1}줄 먼저 나와요. ${k + 2}번째 줄을 열 이름으로 쓰고 위쪽 줄은 지울 수 있어요.`,
        fix: {
          label: `${k + 2}번째 줄을 열 이름으로`,
          auto: true,
          apply: (d) => promoteRowToHeader(d, k),
        },
      });
    }
  }

  // Header names: empty or repeated
  const trimmed = ds.headers.map((h) => h.trim());
  const emptyNames = trimmed.filter((h) => h === "").length;
  const dupNames = trimmed.filter(
    (h, i) => h !== "" && trimmed.indexOf(h) !== i,
  ).length;
  if (emptyNames + dupNames > 0) {
    issues.push({
      id: "headers",
      level: "warn",
      title: "열 이름이 비었거나 겹쳐요",
      detail: `${emptyNames ? `이름 없는 열 ${emptyNames}개` : ""}${emptyNames && dupNames ? ", " : ""}${dupNames ? `이름이 겹치는 열 ${dupNames}개` : ""}. 차트에서 열을 고를 때 헷갈릴 수 있어요.`,
      fix: { label: "이름 자동으로 붙이기", auto: true, apply: nameHeaders },
    });
  }

  // Columns with nothing in them
  const emptyCols = ds.headers.filter(
    (h, c) => !isFilled(h) && !ds.rows.some((r) => isFilled(r[c])),
  ).length;
  if (emptyCols > 0) {
    issues.push({
      id: "empty-columns",
      level: "warn",
      title: `완전히 빈 열이 ${emptyCols}개 있어요`,
      detail: "엑셀에서 서식만 남아 있는 열일 수 있어요.",
      fix: { label: "빈 열 지우기", auto: true, apply: dropEmptyColumns },
    });
  }

  // Numbers with units or symbols ("12.5%", "3,400원")
  const unitCols: number[] = [];
  let unitExample = "";
  for (let c = 1; c < width; c++) {
    const cells = ds.rows.map((r) => r[c] ?? "").filter(isFilled);
    if (cells.length === 0) continue;
    const plain = cells.filter(isNumeric).length;
    const withUnit = cells.filter(
      (v) => !isNumeric(v) && cleanNumber(v) !== null,
    );
    if (
      withUnit.length > 0 &&
      (plain + withUnit.length) / cells.length >= 0.7
    ) {
      unitCols.push(c);
      unitExample ||= withUnit[0];
    }
  }
  if (unitCols.length > 0) {
    issues.push({
      id: "units",
      level: "warn",
      title: "숫자에 단위나 기호가 섞여 있어요",
      detail: `${unitCols
        .slice(0, 3)
        .map((c) => `‘${ds.headers[c] || `열${c + 1}`}’`)
        .join(
          ", ",
        )} 열에 “${unitExample}” 같은 값이 있어요. 단위는 열 이름에 적고 칸에는 숫자만 두는 게 좋아요.`,
      fix: {
        label: "숫자만 남기기",
        auto: true,
        apply: (d) => stripUnits(d, unitCols),
      },
    });
  }

  // Years across the top (wide table): usually wants to be turned sideways
  const yearHeaders = ds.headers
    .slice(1)
    .filter((h) => YEAR.test(h.trim())).length;
  if (yearHeaders >= 3 && yearHeaders >= (width - 1) * 0.7) {
    issues.push({
      id: "wide",
      level: "info",
      title: "연도(또는 월)가 가로로 늘어서 있어요",
      detail:
        "시간에 따른 변화를 그리려면 연도가 세로(첫 열)에 있어야 해요. 행과 열을 바꾸면 돼요.",
      fix: { label: "행과 열 바꾸기", auto: false, apply: transpose },
    });
  }

  // Nothing numeric to draw
  if (numCols.length === 0) {
    const firstColNumeric =
      ds.rows.length > 0 && ds.rows.every((r) => isNumeric(r[0] ?? ""));
    issues.push({
      id: "no-numeric",
      level: "error",
      title: "차트로 그릴 숫자 열이 없어요",
      detail: firstColNumeric
        ? "첫 열은 항목 이름 자리라서 숫자 열로 세지 않아요. 맨 앞에 번호 열을 하나 넣으면 지금 숫자들을 그릴 수 있어요."
        : "첫 열은 항목 이름, 나머지 열 중 하나 이상은 숫자여야 해요. 아래 형식 안내를 보고 표를 고쳐 보세요.",
      fix: firstColNumeric
        ? { label: "번호 열 추가하기", auto: false, apply: addNumberColumn }
        : undefined,
    });
  } else {
    // Blank cells in the columns that will be drawn
    const blankRows = ds.rows.filter((r) =>
      numCols.some((c) => !isFilled(r[c])),
    ).length;
    if (blankRows > 0) {
      issues.push({
        id: "blanks",
        level: "warn",
        title: `숫자 칸이 비어 있는 줄이 ${blankRows}개 있어요`,
        detail:
          "빈 칸은 0으로 그려져요. 값이 없는 줄이라면 지워 두는 편이 좋아요.",
        fix: {
          label: "빈 칸이 있는 줄 지우기",
          auto: false,
          apply: (d) => dropRowsWithBlanks(d, numCols),
        },
      });
    }

    const hasNegative = ds.rows.some((r) =>
      numCols.some(
        (c) =>
          isNumeric(r[c] ?? "") && Number((r[c] ?? "").replace(/,/g, "")) < 0,
      ),
    );
    if (hasNegative) {
      issues.push({
        id: "negative",
        level: "info",
        title: "음수가 있어요",
        detail: "지금 Studio의 막대·원형 차트는 음수를 0으로 그려요.",
      });
    }
  }

  // Same label twice
  const labels = ds.rows
    .map((r) => (r[0] ?? "").trim())
    .filter((v) => v !== "");
  const dupLabels = labels.filter((v, i) => labels.indexOf(v) !== i).length;
  if (dupLabels > 0) {
    issues.push({
      id: "dup-labels",
      level: "info",
      title: `같은 항목 이름이 ${dupLabels}번 더 나와요`,
      detail:
        "같은 이름이 여러 줄이면 막대가 이름만으로는 구분되지 않을 수 있어요. 의도한 거라면 그대로 두세요.",
    });
  }

  return issues;
}

export const hasBlockingIssue = (issues: Issue[]) =>
  issues.some((i) => i.level === "error");

// Applies every safe ("auto") fix, re-checking after each so row/column shifts can't go stale.
export function applyAutoFixes(
  ds: Dataset,
  meta: Meta = {},
): { dataset: Dataset; applied: string[] } {
  let current = ds;
  const applied: string[] = [];
  for (let i = 0; i < 8; i++) {
    const next = inspectDataset(current, meta).find((issue) => issue.fix?.auto);
    if (!next?.fix) break;
    current = next.fix.apply(current);
    applied.push(next.title);
  }
  return { dataset: current, applied };
}
