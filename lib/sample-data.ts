import type { Dataset } from "./csv";

// Example data for the Studio charts, used for the chart previews (hover on the home page and in
// /studio) and meant to be reused wherever an example is needed (docs, guide).
//
// Two parts, so one table can serve several charts and there is less to maintain:
//   SAMPLE_TABLES  the example tables, each with a name
//   SAMPLE_OF      which table each chart uses (chart name -> table name)
// To change the example numbers, edit a table. To give a chart its own table, add one to
// SAMPLE_TABLES and point SAMPLE_OF at it. Every chart in lib/chart-catalog.ts must appear in SAMPLE_OF.
//
// Charts that share a table each pick the columns they need from it (for example a histogram uses
// the first number column, a scatter plot the first two).
export type SampleTable = {
  about: string; // what the table is, and the table shape it is an example of
  headers: string[];
  rows: (string | number)[][];
};

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월"];

export const SAMPLE_TABLES = {
  // item name + one number column, in time order
  monthlyVisitors: {
    about:
      "월별 방문자. 항목 이름 열 1개 + 숫자 열 1개 (시간 순서, 오래된 것부터)",
    headers: ["월", "방문자(명)"],
    rows: MONTHS.map((m, i) => [m, [1200, 1850, 1500, 2300, 2100, 2900][i]]),
  },
  // item name + one number column, parts of a whole
  trafficShare: {
    about:
      "유입 경로 비율. 항목 이름 열 1개 + 숫자 열 1개 (항목 10개 이내, 음수 없음)",
    headers: ["유입 경로", "비율(%)"],
    rows: [
      ["검색", 45],
      ["광고", 25],
      ["추천", 18],
      ["직접", 12],
    ],
  },
  // item name + several number columns
  monthlyChannels: {
    about:
      "월별 채널별 방문자. 항목 이름 열 1개 + 숫자 열 여러 개 (열 하나가 한 계열)",
    headers: ["월", "검색(명)", "광고(명)", "추천(명)"],
    rows: [
      ["1월", 600, 350, 250],
      ["2월", 850, 600, 400],
      ["3월", 700, 450, 350],
      ["4월", 1000, 800, 500],
      ["5월", 900, 700, 500],
      ["6월", 1300, 950, 650],
    ],
  },
  // a group name + one value per row (many rows share a group name)
  classScores: {
    about:
      "반별 시험 점수. 그룹 이름 열 1개 + 숫자 열 1개 (한 줄이 한 값, 같은 그룹 이름이 여러 줄)",
    headers: ["반", "점수"],
    rows: [
      ["A반", 62],
      ["A반", 71],
      ["A반", 75],
      ["A반", 78],
      ["A반", 82],
      ["A반", 85],
      ["A반", 91],
      ["B반", 55],
      ["B반", 60],
      ["B반", 68],
      ["B반", 70],
      ["B반", 73],
      ["B반", 79],
      ["B반", 88],
      ["C반", 48],
      ["C반", 58],
      ["C반", 64],
      ["C반", 69],
      ["C반", 74],
      ["C반", 80],
      ["C반", 95],
    ],
  },
  // upper level + lower level + size
  hierarchy: {
    about: "분류별 매출. 상위 항목 열 + 하위 항목 열 + 크기 숫자 열",
    headers: ["분류", "항목", "매출(만원)"],
    rows: [
      ["전자", "스마트폰", 420],
      ["전자", "노트북", 310],
      ["전자", "이어폰", 120],
      ["의류", "상의", 260],
      ["의류", "하의", 180],
      ["식품", "음료", 150],
      ["식품", "과자", 90],
    ],
  },
  // a point name + three number columns
  scatterPoints: {
    about:
      "제품별 광고비·매출·고객 수. 점 이름 열 + 숫자 열 3개 (가로축 값, 세로축 값, 버블 크기)",
    headers: ["제품", "광고비(만원)", "매출(만원)", "고객 수(명)"],
    rows: [
      ["A", 100, 520, 300],
      ["B", 180, 760, 520],
      ["C", 240, 940, 410],
      ["D", 320, 1350, 800],
      ["E", 90, 380, 150],
      ["F", 150, 640, 360],
      ["G", 280, 1100, 620],
      ["H", 60, 300, 120],
    ],
  },
  // row names + several number columns forming a grid
  weekHours: {
    about:
      "요일·시간대별 방문자. 행 이름 열 1개 + 숫자 열 여러 개 (행 × 열 표)",
    headers: ["요일", "오전", "오후", "저녁"],
    rows: [
      ["월", 120, 340, 210],
      ["화", 140, 360, 230],
      ["수", 130, 380, 250],
      ["목", 150, 390, 270],
      ["금", 160, 420, 360],
      ["토", 90, 310, 450],
      ["일", 70, 250, 380],
    ],
  },

  // ---- tables only one chart uses ----
  cashFlow: {
    about:
      "현금 증감. 항목 이름 열 1개 + 증감 숫자 열 1개 (양수는 증가, 음수는 감소)",
    headers: ["항목", "증감(만원)"],
    rows: [
      ["기초 잔액", 500],
      ["매출", 320],
      ["인건비", -180],
      ["광고비", -90],
      ["기타 수익", 60],
      ["임대료", -70],
    ],
  },
  defects: {
    about: "불량 유형별 건수. 항목 이름 열 1개 + 건수 열 1개 (큰 순서로 정렬)",
    headers: ["불량 유형", "건수"],
    rows: [
      ["스크래치", 48],
      ["찍힘", 30],
      ["색 불균일", 18],
      ["치수 불량", 10],
      ["기타", 6],
    ],
  },
  experiment: {
    about: "실험군별 점수. 항목 이름 열 1개 + 평균 열 1개 + 오차 열 1개",
    headers: ["실험군", "평균(점)", "오차(±)"],
    rows: [
      ["대조군", 52, 4.5],
      ["실험군 A", 61, 5.2],
      ["실험군 B", 68, 3.8],
      ["실험군 C", 74, 6.1],
    ],
  },
  skills: {
    about: "팀원별 역량. 항목 이름 열 1개(축) + 숫자 열 1개 이상(비교 대상)",
    headers: ["역량", "팀원 A", "팀원 B"],
    rows: [
      ["기획", 80, 60],
      ["디자인", 65, 85],
      ["개발", 90, 55],
      ["소통", 70, 90],
      ["문서화", 60, 75],
    ],
  },
  userFlow: {
    about: "이용 흐름. 출발 열 + 도착 열 + 크기 숫자 열 (한 줄이 흐름 하나)",
    headers: ["출발", "도착", "방문자(명)"],
    rows: [
      ["검색", "홈", 600],
      ["광고", "홈", 350],
      ["추천", "홈", 250],
      ["홈", "스튜디오", 700],
      ["홈", "이탈", 500],
      ["스튜디오", "저장", 300],
      ["스튜디오", "이탈", 400],
    ],
  },
  countries: {
    about: "국가별 사용자. 국가 이름 열 1개 + 숫자 열 1개",
    headers: ["국가", "사용자(명)"],
    rows: [
      ["대한민국", 5200],
      ["미국", 3100],
      ["일본", 2400],
      ["중국", 1800],
      ["독일", 900],
      ["영국", 850],
      ["프랑스", 700],
      ["브라질", 450],
      ["인도", 1200],
      ["호주", 380],
    ],
  },
  schedule: {
    about:
      "프로젝트 일정. 작업 이름 열 + 시작 날짜 열 + 종료 날짜 열 (YYYY-MM-DD)",
    headers: ["작업", "시작", "종료"],
    rows: [
      ["기획", "2026-01-05", "2026-01-23"],
      ["디자인", "2026-01-19", "2026-02-13"],
      ["개발", "2026-02-09", "2026-04-03"],
      ["테스트", "2026-03-23", "2026-04-17"],
      ["출시", "2026-04-20", "2026-04-24"],
    ],
  },
  cityPopulation: {
    about:
      "도시별 인구 변화. 시간 열 1개(연도·월 등, 오래된 것부터) + 항목별 숫자 열 여러 개",
    headers: ["연도", "서울", "부산", "대구", "인천"],
    rows: [
      [2018, 970, 340, 245, 295],
      [2019, 965, 337, 243, 296],
      [2020, 960, 335, 240, 297],
      [2021, 950, 332, 238, 298],
      [2022, 942, 329, 236, 300],
      [2023, 935, 327, 234, 301],
    ],
  },
} satisfies Record<string, SampleTable>;

export type SampleTableName = keyof typeof SAMPLE_TABLES;

// chart name (same as lib/chart-catalog.ts and ChartDefinition.type) -> the table it is shown with
export const SAMPLE_OF: Record<string, SampleTableName> = {
  // bar family
  "막대 차트": "monthlyVisitors",
  "그룹 막대 차트": "monthlyChannels",
  "누적 막대 차트": "monthlyChannels",
  "100% 누적 막대 차트": "monthlyChannels",
  "오차 막대 차트": "experiment",
  "폭포 차트": "cashFlow",
  "파레토 차트": "defects",
  // line / area family
  "선 차트": "monthlyVisitors",
  "면적 차트": "monthlyVisitors",
  "누적 면적 차트": "monthlyChannels",
  // pie / composition family
  "원형 차트": "trafficShare",
  "도넛 차트": "trafficShare",
  트리맵: "hierarchy",
  "선버스트 차트": "hierarchy",
  // distribution family
  히스토그램: "classScores",
  "밀도 그래프": "classScores",
  "박스 플롯": "classScores",
  "바이올린 플롯": "classScores",
  "스트립 플롯": "classScores",
  // relation family
  산점도: "scatterPoints",
  "버블 차트": "scatterPoints",
  히트맵: "weekHours",
  "상관 행렬 그래프": "weekHours",
  // others
  "레이더 차트": "skills",
  "생키 다이어그램": "userFlow",
  "세계 지도 단계구분도": "countries",
  "간트 차트": "schedule",
  "바 차트 레이스": "cityPopulation",
};

// The example table of a chart as a Dataset (all values as text, like an uploaded file), or null if
// the chart has no example yet.
export function sampleDataset(type: string): Dataset | null {
  const name = SAMPLE_OF[type];
  if (!name) return null;
  const table: SampleTable = SAMPLE_TABLES[name];
  return {
    name: "sample.csv",
    headers: table.headers,
    rows: table.rows.map((row) => row.map(String)),
  };
}
