@AGENTS.md

# MAC Studio — AI 작업 가이드

MAC(Make A Chart)의 무료 버전 **Studio**. CSV·XLSX를 올리면 차트를 만들고 다듬어서 이미지로 내려받는
비개발자용 노코드 도구입니다. 유료 버전 Expert는 이 저장소의 범위가 아닙니다.
작업 목록은 [docs/TODO.md](docs/TODO.md)에 있고, 프로젝트 소개는 [README.md](README.md)에 있습니다.

## 먼저 알아둘 것

- **모든 처리는 브라우저에서 합니다.** 파일 읽기, 차트 그리기, 이미지 내보내기에 서버가 없습니다.
- **백엔드는 아직 없습니다.** 로그인·저장·이메일 인증은 브라우저 저장소를 쓰는 **데모 구현**입니다
  (`lib/auth.ts`, `lib/saved.ts`, `lib/email-verification.ts`, `lib/auth-api.ts`의 mock).
  이 데모 코드의 보안 수준을 높이려고 하지 마세요. 서버가 생기면 통째로 바뀝니다.
- 사용자에게 보이는 글은 **한국어 해요체**("저장했어요", "다시 시도해 주세요")입니다. 코드 주석과
  변수명은 영어입니다.
- 이 프로젝트의 Next.js는 학습 데이터와 다른 버전(16)입니다. Next 관련 코드를 쓰기 전에
  `node_modules/next/dist/docs/`의 해당 문서를 읽으세요.

## 명령어

```bash
npm install        # 처음 한 번
npm run dev        # 개발 서버 http://localhost:3000
npm run lint       # 코드 검사 (에러 0개여야 함)
npm run build      # 프로덕션 빌드 (타입 검사 포함, 반드시 통과해야 함)
```

작업을 끝내기 전에 **`npm run lint`와 `npm run build`를 둘 다 실행**하고, 화면이 바뀌는 작업이면
`npm run dev`로 직접 열어서 확인하세요. 테스트 코드는 없습니다.

## 폴더 구조

```
app/            페이지 (/, /studio, /studio/editor, /studio/loading, /mypage, /guide, /login, /signup, /terms, /privacy, /auth/*)
                (/studio의 실제 화면은 components/studio-flow.tsx, page.tsx는 미리보기를 그려 넘기는 서버 컴포넌트)
components/     화면 조각. 차트는 components/charts/
lib/            차트 옵션·데이터 처리, 파일 파싱, 내보내기, 인증·저장
docs/TODO.md    해야 할 일
```

사용자 흐름: 업로드(`/studio`) → 데이터 확인 → 차트 선택 → `/studio/loading` → 편집(`/studio/editor`).
차트는 한 번에 **하나씩** 만들고, 저장하면 데이터셋 폴더 아래에 쌓입니다(마이페이지).
작업 중인 상태는 `lib/workspace.ts`가 들고 있습니다.

## 차트 추가하는 법 (가장 자주 할 일)

`components/charts/README.md`에 자세히 있습니다. 요약:

1. `components/charts/<이름>-chart.tsx`를 만들어 컴포넌트(`{ spec, data }` → SVG)와 `ChartDefinition`을 export
   (`bar-chart.tsx`를 복사해서 시작하세요. `ChartFrame`으로 감싸면 제목·배경·여백·글꼴이 공짜입니다).
2. `components/charts/registry.ts`의 `CHARTS`에 추가.
3. **`ChartDefinition.type`은 `lib/chart-catalog.ts`의 한글 이름과 글자 하나까지 같아야 합니다**
   (예: `'도넛 차트'`). 같아야 홈의 차트 목록에 "이용 가능"으로 바뀝니다.
4. 이 차트가 쓰는 옵션만 `supports`에 켭니다. 옵션 패널은 `supports`에 따라 항목을 숨깁니다.
5. **샘플 데이터는 `lib/sample-data.ts`에 28종 모두 이미 있습니다.** 차트를 등록하면 홈의 차트 목록과 `/studio` 차트 선택에서
   마우스를 올렸을 때 예시 그림이 **자동으로 나옵니다**(따로 연결할 것이 없습니다). 만든 차트에 그 샘플 표가 안 맞으면
   (열 개수·모양이 다르면) `sample-data.ts`의 해당 항목을 고치세요. `shape`에 이 차트가 원하는 표 모양을 글로 적어 두었습니다.
6. 이 차트에 맞는 분류(막대형, 선·면적형 등)는 `lib/chart-catalog.ts`에 이미 정해져 있습니다. 분류를 바꾸고 싶으면 거기서 한 줄만 옮깁니다.

새 옵션이 필요하면: `lib/chart-spec.ts`의 `ChartSpec`에 필드와 기본값을 추가하고(예전에 저장한 차트는
기본값이 자동으로 채워집니다), `components/chart-options-panel.tsx`에 컨트롤을 추가하고, 차트에서 읽습니다.

## 차트 미리보기 (빌드 때 그려 둡니다)

- 미리보기 그림은 **사용자 기기에서 계산하지 않습니다.** 서버 컴포넌트(`app/page.tsx`, `app/studio/page.tsx`)가
  `renderPreviews()`(`components/preview-nodes.tsx`)로 **빌드할 때 한 번** 차트를 그려서, 화면 컴포넌트
  (`HoverPreview`, `ChartPicker`)에 완성된 결과만 넘깁니다. 차트 그리는 코드가 그대로라서 실제 모양과 어긋나지 않습니다.
- 그래서 `app/studio/page.tsx`는 **서버 컴포넌트로 유지**하세요. `"use client"`를 붙이면 안 됩니다. 실제 화면은
  `components/studio-flow.tsx`(클라이언트)에 있습니다.
- `react-dom/server`(HTML/SVG 문자열 만들기)는 Next.js 서버 컴포넌트 안에서 쓸 수 없습니다(빌드 에러). 그림을 파일로
  만들려고 하지 말고, 지금 방식(서버 컴포넌트가 그려서 prop으로 전달)을 따르세요.
- 예시 데이터는 **`lib/sample-data.ts` 한 파일**에만 있습니다(차트 이름 → 표). 숫자·행·열을 바꾸고 싶으면 거기서만 고치세요.
  차트가 하나 늘 때마다 CHART_NEEDS(`lib/data-guide.ts`, 사용자에게 보이는 데이터 안내)와 표 모양이 어긋나지 않는지 같이 봅니다.
- 미리보기는 샘플 데이터로 그린 **예시**입니다. "내 데이터로 미리보기"가 필요하면 별도 작업으로 하세요(큰 데이터는 느려질 수 있어
  앞쪽 일부 행만 써야 합니다).

## 브라우저 저장소 (오래 남기지 않습니다)

`localStorage`는 읽고 쓰는 것이 동기라서, 안 쓰는 데이터가 쌓이면 모든 페이지가 느려집니다. 그래서 **저장하는 모든 것에
보관 기간이 있고**, `lib/storage-cleanup.ts`가 페이지를 열 때마다(브라우저가 한가할 때) 기간이 지난 것을 지웁니다.

| 데이터 | 위치 | 보관 |
| --- | --- | --- |
| 작업 중인 차트(새로고침 대비), 이메일 인증 정보 | sessionStorage | 탭을 닫으면 사라짐 |
| 소셜 로그인 진행 중 정보(`mac-studio:social:*`) | localStorage | 10분 |
| 로그인 표시(`mac-studio:user`) | localStorage | 마지막 사용 후 30일 |
| 계정별 저장 데이터(`mac-studio:saved:v3:*`) | localStorage | 그 계정을 마지막으로 쓴 뒤 90일 |
| 옛 형식 저장 데이터(`saved:v1`, `v2`) | localStorage | 바로 삭제 |

- **새 키를 만들면** `lib/storage-keys.ts`에 등록하고, 보관 기간을 정해 `sweepStorage()`에 정리 규칙을 추가하세요.
  기간 없이 계속 쌓이는 키는 만들지 않습니다. 가능하면 `sessionStorage`를 먼저 고려하세요.
- 저장된 데이터는 마이페이지에 "90일이 지나면 정리돼요"로 안내합니다(`RETENTION`). 기간을 바꾸면 안내 문구도 같이 바뀝니다.
- 백엔드로 저장이 옮겨가면 계정별 저장 데이터 정리(4번 단계)는 필요 없으니 그때 제거하세요.
- `useStoredString`(`lib/external-store.ts`)은 렌더마다 `localStorage`를 읽습니다. 큰 값을 여러 곳에서 읽지 마세요.

## 코드 스타일 (중요: 파일마다 다릅니다)

프로젝트에 Prettier 설정 파일이 없고, 폴더마다 스타일이 다릅니다.

| 위치 | 스타일 |
| --- | --- |
| `components/charts/*`, `lib/chart-*.ts`, `lib/export.ts`, `lib/saved.ts`, `lib/auth.ts` 등 | 세미콜론 없음, 작은따옴표, 한 줄 최대 약 210자 |
| `app/*`, `components/*`(charts 제외), `lib/csv.ts`, `lib/workspace.ts`, `lib/auth-api.ts`, `lib/social-auth.ts` 등 | Prettier 기본값 (세미콜론, 큰따옴표) |

**애매하면 수정할 파일을 열어서 확인하세요.** 줄 끝에 `;`가 없으면 위쪽 스타일입니다. 새 파일은 같은 폴더의 이웃 파일을 따라갑니다.

- **`prettier --write`를 폴더 전체(`components`, `lib`, `app`)에 돌리지 마세요.** 파일 수십 개의 모양이 바뀌어
  리뷰가 불가능해집니다. 바꾼 파일에만, 그 파일의 기존 스타일로 맞추세요.
  (차트 쪽: `npx prettier --no-semi --single-quote --print-width 210 --write <파일>`)
- 작업과 상관없는 파일은 건드리지 마세요. 끝낸 뒤 `git diff --stat`으로 바꾼 파일이 의도한 것뿐인지 확인합니다.
- 주석은 "무엇"이 아니라 "왜"를 한두 줄로. 기존 코드의 주석 밀도에 맞추세요.

## 색상과 다크 모드

- 색은 `bg-[color:var(--c-bg-ffffff)]`처럼 **`--c-<역할>-<hex>` 토큰**으로 씁니다. 라이트/다크 값은
  `app/globals.css` 한 곳에 있습니다.
- **새 색을 쓰면 `globals.css`의 `:root`와 `.dark` 양쪽에 토큰을 추가**하세요. 안 하면 색이 안 나옵니다.
- 차트·사이트 공용 색은 `lib/chart-palette.ts`의 `PALETTE`(8색)입니다. 임의의 색 대신 이걸 쓰세요.
- 사이트 글꼴은 에스코어 드림, **차트 안의 글꼴은 별개**입니다(`lib/chart-fonts.ts`, 이미지로 내보내야 해서 시스템 글꼴).

## Next.js 16에서 이미 겪은 함정

- 컴포넌트가 렌더되는 동안 `new Date()`, `Math.random()`을 쓰면 빌드가 실패합니다(`cacheComponents`).
  이벤트 핸들러나 `useEffect` 안에서만 쓰세요.
- 동적 라우트의 `params`는 Promise입니다(`await params`). 타입은 `PageProps<"/경로/[x]">`.
- `useEffect` 안에서 바로 `setState`를 부르면 린트 에러(`react-hooks/set-state-in-effect`)입니다.
  브라우저 값(주소창, 저장소)은 `useSyncExternalStore`로 읽으세요(`lib/external-store.ts` 참고).
- 서버 컴포넌트에서 훅이 들어 있는 모듈을 import하면 빌드가 실패합니다. 훅이 필요한 파일은 맨 위에 `"use client"`.
- 브라우저 저장소(`localStorage`)는 접근이 막힐 수 있으니 항상 `try/catch`로 감쌉니다.

## 하지 말 것

- 사용자 동의 없이 `git commit`, `git push`, 브랜치 병합을 하지 마세요. 커밋·PR은 사람이 합니다.
- `.env*`에 실제 키를 넣거나 커밋하지 마세요(`.env.example`만 커밋). client secret은 프론트에 두지 않습니다.
- 요청받지 않은 리팩터링, 의존성(라이브러리) 추가, 폴더 구조 변경을 하지 마세요. 새 라이브러리가 필요해 보이면
  먼저 사람에게 물어보세요.
- Expert(유료) 기능을 만들지 마세요.

## Git 규칙

- 브랜치는 `develop`에서 만들고 `develop`으로 PR합니다. `main`은 배포용(Vercel)이라 직접 올리지 않습니다.
- 브랜치 이름 예: `feat/261101`, `fix/261101`. 커밋 메시지 접두사: `feat:` `fix:` `refactor:` `style:` `docs:`.

## AI로 작업하는 순서 (권장)

1. TODO에서 할 일 **하나**만 고릅니다. 한 번에 한 가지씩.
2. AI에게 "먼저 계획만 세워 줘. 어떤 파일을 어떻게 바꿀지 알려줘"라고 시키고, 계획이 TODO의 "건드릴 파일"과 맞는지 봅니다.
3. 구현을 시키고 `npm run lint`, `npm run build`를 돌립니다(둘 다 AI에게 시켜도 됩니다).
4. `npm run dev`로 열어서 직접 눌러 봅니다. 라이트/다크 모드, 모바일 폭(브라우저 개발자도구)까지 확인합니다.
5. `git diff --stat`으로 의도한 파일만 바뀌었는지 확인한 뒤 커밋·PR.
6. 막히면 같은 질문을 반복하지 말고 에러 메시지 전체를 AI에게 붙여 주고, 그래도 안 되면 팀장에게 물어보세요.
