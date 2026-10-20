// Content for the data format guide (/guide): rules, examples, sample files and the AI prompt.

export const RULES = [
  { title: "첫 줄은 열 이름", desc: "제목, 설명, 출처, 빈 줄은 넣지 않아요." },
  {
    title: "첫 열은 항목 이름",
    desc: "월, 지역, 제품처럼 막대 하나(조각 하나)가 될 이름이에요.",
  },
  {
    title: "나머지 열은 숫자만",
    desc: "단위(%, 원, 명)와 기호는 빼고, 단위는 열 이름에 적어요.",
  },
  {
    title: "한 줄에 항목 하나",
    desc: "합계·소계 줄, 합쳐진 칸, 빈 줄은 없애요.",
  },
  {
    title: "시간은 세로로",
    desc: "연도·월은 첫 열에 위에서 아래로, 오래된 것부터 놓아요.",
  },
];

export type Table = { headers: string[]; rows: string[][] };

export type Example = {
  title: string;
  bad: Table;
  good: Table;
  how: string; // what to do
  autoFix: string | null; // which data-check fix covers it, if any
};

export const EXAMPLES: Example[] = [
  {
    title: "맨 위에 제목 줄이 있어요",
    bad: {
      headers: ["2025년 월별 현황", "", ""],
      rows: [
        ["월", "방문자", "전환수"],
        ["1월", "1200", "90"],
        ["2월", "1850", "140"],
      ],
    },
    good: {
      headers: ["월", "방문자", "전환수"],
      rows: [
        ["1월", "1200", "90"],
        ["2월", "1850", "140"],
      ],
    },
    how: "열 이름이 있는 줄이 맨 위에 오도록 위쪽 줄을 지워요.",
    autoFix:
      "데이터 확인 단계에서 “몇 번째 줄을 열 이름으로” 버튼으로 고칠 수 있어요.",
  },
  {
    title: "숫자에 단위가 붙어 있어요",
    bad: {
      headers: ["월", "방문자", "증가율"],
      rows: [
        ["1월", "1,200명", "12.5%"],
        ["2월", "1,850명", "54.1%"],
      ],
    },
    good: {
      headers: ["월", "방문자(명)", "증가율(%)"],
      rows: [
        ["1월", "1200", "12.5"],
        ["2월", "1850", "54.1"],
      ],
    },
    how: "칸에는 숫자만 두고, 단위는 열 이름 옆에 적어요.",
    autoFix:
      "“숫자만 남기기” 버튼으로 고칠 수 있어요. (열 이름의 단위는 직접 적어 주세요.)",
  },
  {
    title: "연도가 가로로 늘어서 있어요",
    bad: {
      headers: ["지역", "2022", "2023", "2024"],
      rows: [
        ["서울", "120", "135", "150"],
        ["부산", "80", "85", "90"],
      ],
    },
    good: {
      headers: ["연도", "서울", "부산"],
      rows: [
        ["2022", "120", "80"],
        ["2023", "135", "85"],
        ["2024", "150", "90"],
      ],
    },
    how: "시간에 따른 변화는 연도가 세로로 가야 선 차트가 돼요. 행과 열을 바꿔요.",
    autoFix: "“행과 열 바꾸기” 버튼으로 고칠 수 있어요.",
  },
  {
    title: "합계 줄이 섞여 있어요",
    bad: {
      headers: ["지역", "매출"],
      rows: [
        ["서울", "300"],
        ["부산", "200"],
        ["합계", "500"],
      ],
    },
    good: {
      headers: ["지역", "매출"],
      rows: [
        ["서울", "300"],
        ["부산", "200"],
      ],
    },
    how: "합계 줄이 있으면 그 막대(조각)가 따로 그려져 비율이 틀어져요. 지워 주세요.",
    autoFix: null,
  },
  {
    title: "숫자 칸이 비어 있어요",
    bad: {
      headers: ["월", "방문자"],
      rows: [
        ["1월", "1200"],
        ["2월", ""],
        ["3월", "1500"],
      ],
    },
    good: {
      headers: ["월", "방문자"],
      rows: [
        ["1월", "1200"],
        ["3월", "1500"],
      ],
    },
    how: "빈 칸은 0으로 그려져요. 값이 없는 달은 줄을 지우거나, 실제 값을 채워요.",
    autoFix: "“빈 칸이 있는 줄 지우기” 버튼으로 고칠 수 있어요.",
  },
];

// What each chart needs from the table. Keyed by the chart's registry name; add one when a chart is added.
export const CHART_NEEDS: Record<string, { shape: string; example: string }> = {
  "막대 차트": {
    shape: "항목 이름 열 + 숫자 열. 항목마다 막대 하나가 그려져요.",
    example: "지역별 매출, 제품별 판매량",
  },
  "선 차트": {
    shape: "시간(연도·월·일) 열 + 숫자 열. 오래된 것부터 위에서 아래로 놓아요.",
    example: "월별 방문자, 연도별 기온",
  },
  "원형 차트": {
    shape:
      "항목 이름 열 + 숫자 열 하나. 항목은 10개 안팎이 보기 좋아요. 음수는 쓸 수 없어요.",
    example: "응답 비율, 예산 구성",
  },
};
export const DEFAULT_NEED = { shape: "항목 이름 열 + 숫자 열.", example: "" };

export type Sample = {
  id: string;
  name: string;
  desc: string;
  filename: string;
  csv: string;
};

export const SAMPLES: Sample[] = [
  {
    id: "monthly",
    name: "월별 방문자",
    desc: "막대·선 차트용. 시간 순서로 정렬된 숫자 열이 두 개 있어요.",
    filename: "sample_monthly_visitors.csv",
    csv: "월,방문자(명),전환수(건)\n1월,1200,90\n2월,1850,140\n3월,1500,110\n4월,2300,210\n5월,2100,180\n6월,2900,260\n",
  },
  {
    id: "share",
    name: "유입 경로 비율",
    desc: "원형 차트용. 숫자 열이 하나이고 항목이 4개예요.",
    filename: "sample_traffic_share.csv",
    csv: "유입 경로,비율(%)\n검색,45\n광고,25\n추천,18\n직접,12\n",
  },
  {
    id: "blank",
    name: "빈 양식",
    desc: "열 이름만 있는 양식이에요. 내용을 채워서 올리세요.",
    filename: "template_blank.csv",
    csv: "항목,값1,값2\n,,\n",
  },
];

const CHART_HINT: Record<string, string> = {
  "막대 차트":
    "차트 종류: 막대 차트. 비교할 항목을 한 줄씩, 크기를 숫자 열로 만들어 주세요.",
  "선 차트":
    "차트 종류: 선 차트. 시간(연도·월·일)을 첫 번째 열에 세로로, 오래된 것부터 정렬해 주세요.",
  "원형 차트":
    "차트 종류: 원형 차트. 숫자 열은 하나만 두고, 항목은 10개 이내로 해 주세요. 작은 항목은 ‘기타’로 합쳐 주세요. 음수는 쓰지 마세요.",
};

export function buildPrompt(chartType?: string) {
  const hint = chartType
    ? (CHART_HINT[chartType] ?? `차트 종류: ${chartType}.`)
    : "";
  return `당신은 데이터 정리 도우미입니다. 아래 [원본 데이터]를 차트 서비스(MAC Studio)에 올릴 수 있는 CSV 표로 바꿔 주세요.

[표 규칙]
1. 첫 줄은 열 이름입니다. 제목, 설명, 출처, 빈 줄은 넣지 마세요.
2. 첫 번째 열은 항목 이름입니다. (예: 월, 지역, 제품명)
3. 두 번째 열부터는 숫자만 넣습니다. 단위(%, 원, 명 등)와 천 단위 쉼표는 빼고, 단위는 열 이름에 적어 주세요. (예: 매출(만원))
4. 한 줄이 항목 하나입니다. 합계·소계 줄, 합쳐진 칸, 빈 줄은 없애 주세요.
5. 시간(연도·월)이 있으면 첫 번째 열에 세로로 놓고, 오래된 것부터 순서대로 정렬해 주세요.
6. 값이 없는 칸은 비워 두지 말고, 그 줄을 빼거나 0으로 채우고 어떻게 했는지 알려 주세요.${hint ? `\n7. ${hint}` : ""}

[출력 형식]
- 쉼표(,)로 구분한 CSV만 코드 블록으로 출력해 주세요. 첫 줄은 열 이름입니다.
- 표 아래에 바꾼 내용(지운 줄, 합친 값, 채운 값 등)을 한두 줄로 요약해 주세요.

[예시]
월,방문자(명),전환수(건)
1월,1200,90
2월,1850,140

[원본 데이터]
(여기에 원본 데이터를 붙여넣거나 파일을 첨부해 주세요)`;
}
