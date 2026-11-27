# 백엔드 연동 체크리스트 (MAC-BE ↔ Studio)

기준: [MAC-BE](https://github.com/MAC-MakeAnimationChart/MAC-BE) 저장소(Java 17, Spring Boot 4.1, MySQL, S3)를 읽고 정리했어요.
요청·응답 필드의 정확한 모양은 **BE 저장소의 `docs/AUTH_API.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/MVP_DESIGN.md`와 Swagger(로컬)** 가 원본입니다.
이 문서는 "FE가 무엇을 바꿔야 하는지"와 "BE에 무엇을 요청해야 하는지"만 적어요. BE가 바뀌면 이 문서도 같이 고치세요.

표기: ✅ 이미 맞음 · 🔧 FE가 바꿔야 함 · 📮 BE에 요청/확인 · 👤 사람이 결정(→ `docs/EH_TODO.md`)

> **중요**: 예전에 BE 팀에 보낸 명세(`POST /auth/social` + `POST /me/terms`, 쿠키 세션)는 **BE의 실제 설계와 다릅니다.**
> 이 문서가 최신 기준이에요. `lib/auth-api.ts`의 가짜 서버(mock)는 아래 계약에 맞춰 다시 만들어야 합니다.

---

## 0. BE 계약 요약 (읽고 시작하세요)

| 항목 | 내용 |
| --- | --- |
| 기본 경로 | `/api/v1` |
| 인증 방식 | **Access JWT**(수명 600초, 응답 JSON으로 받아 **JS 메모리에만** 보관) + `Authorization: Bearer …` |
| 갱신 | **Refresh 쿠키 `mac_refresh`**(HttpOnly, `Path=/api/v1/auth`, SameSite=Lax, Secure). JS에서 못 읽음. `POST /auth/refresh`가 회전 |
| 인증 POST 필수 조건 | 허용된 **`Origin`** + 헤더 **`X-Requested-With: MAC`** + `Content-Type: application/json`(refresh·logout 제외). 아니면 403/415 |
| 요청 제한 | 인증 POST는 IP·경로당 분당 30회, `send-code`는 분당 5회(429 `AUTH_RATE_LIMITED`). 이메일은 시간당 5회 |
| 오류 형식 | `{ "code": "...", "message": "한국어 안내" }`. **`code`로 분기**하고 `message`는 그대로 보여줘도 됨 |
| CORS | `CORS_ALLOWED_ORIGINS`에 적힌 Origin만. 허용 헤더: Authorization, Content-Type, If-Match, Idempotency-Key, X-Requested-With. credentials 허용 |
| 용량 한도 | 비회원 업로드 5MB / 회원 업로드 10MB / 회원 저장 합계 30MB (`lib/limits.ts`와 같음 ✅) |

---

## 1. 환경·배포 (먼저)

- [x] 환경변수(구현됨): `NEXT_PUBLIC_IS_MOCK=false`로 실제 BE 사용(미설정/true면 mock), `NEXT_PUBLIC_API_BASE`는 서버 **주소만**(예: `http://localhost:8080`, `/api/v1`은 코드가 붙임), `NEXT_PUBLIC_TERMS_VERSION`(임시 `v1`, BE 필수 버전과 일치해야 함). `.env.example` 참고.
- **구현 현황(2026-11-25)**: §2 API 클라이언트, §3 세션 복원·로그아웃(`/auth/refresh`, `/auth/logout`), §4 소셜(200/202·signup), §5 이메일 가입·로그인 FE 코드는 BE 문서(`AUTH_API.md`) 계약대로 작성했어요. **실제 BE가 아닌 계약대로 만든 임시 서버(stub)로 이메일 가입·로그인·새로고침 복원·로그아웃을 브라우저에서 확인**했고, 소셜은 mock만 확인했어요(실제 BE·제공사 검증 전). **비밀번호 재설정(`/reset-password`)과 회원 탈퇴(`/withdraw`, 소셜은 `/auth/social/reauth` 재인증 후)도 구현**했고 이메일 계정 쪽은 같은 임시 서버로 확인했어요(소셜 재인증은 실제 제공사·BE 검증 전). 저장(§7)은 아직이에요.
- 참고: BE에 `GET /me`가 **있어요**(AUTH_API §8). 필요하면 쓰고, 지금은 refresh 응답의 `member`를 써요.
- [ ] 📮 BE `CORS_ALLOWED_ORIGINS`에 **FE 주소를 정확히**(포트까지, 끝 `/` 없이) 넣어 달라고 요청. 개발 기본값은 `http://localhost:3000`.
- [ ] 📮 BE의 소셜 `*_OAUTH_REDIRECT_URIS` 허용 목록에 FE 콜백 주소 등록: `https://도메인/auth/callback/{google|kakao|naver}` (개발은 `http://localhost:3000/auth/callback/{provider}`). **FE 콜백 경로가 이 형식과 같아야 함** → §4.
- [ ] 👤 **쿠키와 도메인 결정**: refresh 쿠키는 `SameSite=Lax`, Domain 미지정. FE(Vercel)와 API가 **다른 사이트**면 브라우저가 `fetch`에 쿠키를 안 실어 보내요.
  - 선택지 ① 같은 상위 도메인(`app.example.com` / `api.example.com`) ② Next.js `rewrites`로 `/api/*`를 BE에 프록시(같은 출처로 보임)
  - 로컬은 `localhost:3000` ↔ `localhost:8080`이 같은 사이트라 괜찮아요. **배포 전에 결정해야 해서 EH_TODO에 올렸어요.**
- [ ] 📮 로컬 HTTP에서는 BE `AUTH_SECURE_COOKIE=false`여야 쿠키가 저장됨(운영은 true). 로컬 실행법은 BE README 참고.
- [ ] 📮 로컬 확인용 Swagger는 BE 로컬 프로필에서만 켜져요(`springdoc.*.enabled`). 켜는 방법을 BE에게 확인.

## 2. API 클라이언트 (`lib/api-client.ts`) 🔧

- [x] 요청마다 `Authorization: Bearer <accessToken>`(토큰은 모듈 메모리 변수 — **localStorage에 저장 금지**). 로그인·refresh 응답을 받는 쪽에서 `setAccessToken()`을 불러야 해요(§3·§5에서 연결).
- [x] 인증 POST(`/auth/*`)에는 `X-Requested-With: MAC` 자동 부착. (구현됨: `lib/api-client.ts`)
- [x] **401을 받으면** `POST /auth/refresh`를 한 번 시도 후 재시도, 동시 401은 refresh 하나를 공유. (구현됨, 실제 BE로 미검증)
- [ ] 오류를 `ApiError(code, message, status)`로 던지고, 화면은 `code`로 분기(문구 하드코딩 대신 BE `message` 사용 가능).
- [ ] 429(`AUTH_RATE_LIMITED`)는 "잠시 후 다시 시도해 주세요"로 안내.
- [ ] 저장 API는 `multipart/form-data`를 쓰므로 이때는 `Content-Type`을 직접 지정하지 않기(브라우저가 boundary를 붙임).

## 3. 세션 복원 · 로그아웃 (`lib/auth.ts`) 🔧

- [ ] 앱이 열릴 때 `POST /auth/refresh`로 로그인 상태 복원(쿠키가 있으면 새 Access와 회원 정보가 옴). 복원 중에는 "로그인 확인 중" 상태를 두어 **로그인/로그아웃 화면이 깜빡이지 않게**.
- [ ] 현재 `lib/auth.ts`의 `localStorage` 로그인 표시(`mac-studio:user`, 30일)는 서버 세션으로 대체. `/me`에 해당하는 GET은 **BE 문서에 없어요** → 회원 정보는 login/refresh 응답에서 받는 것으로 설계(📮 `GET /me` 필요 여부 확인, §8).
- [ ] 로그아웃: `POST /auth/logout`(쿠키 삭제됨) 후 메모리 토큰과 작업 중 상태 정리.
- [ ] 탭이 여러 개일 때 한 탭이 refresh하면 다른 탭의 쿠키 값이 바뀜 → 실패 시 재로그인 유도로 충분한지 확인.

## 4. 소셜 로그인 (`lib/social-auth.ts`, `components/social-callback.tsx`) 🔧

BE 흐름은 **제가 만든 mock과 달라요.**

- [ ] 콜백 경로를 BE 허용 주소와 동일하게: `/auth/callback/{provider}` (현재 FE 경로를 확인하고 맞추기).
- [ ] 제공사에서 받은 `code`(+ PKCE `code_verifier`, `redirect_uri`, 네이버는 **`state`도**)를 `POST /auth/social`로 전달. 정확한 필드명은 BE `AUTH_API.md`.
- [ ] 응답이 두 갈래:
  - **200**: 기존 회원 → 로그인 완료(Access JSON + refresh 쿠키)
  - **202**: 신규 신원 → 약관 동의 단계. 서버가 `mac_social_signup` 쿠키(10분)를 심고 **가입 대기 정보**를 본문으로 줌 → 약관 동의 화면 → `POST /auth/signup`(`signupType: "SOCIAL"`)으로 마무리(성공 시 201 + 자동 로그인)
- [ ] 따라서 **`POST /me/terms`는 없어요.** `acceptTerms()`와 `needsTerms`/`isNewUser` 가정 제거. 약관 동의 항목은 signup 요청에 포함(필드/타입 값은 BE `ConsentDocumentType` 확인 📮).
- [ ] 10분 안에 가입을 끝내지 못하면 202 단계가 만료 → 처음부터 다시 로그인하도록 안내.
- [ ] 팝업/PKCE/state 검증은 FE에 이미 있음 ✅. BE가 요구하는 값이 모두 들어가는지만 확인.
- [ ] 제공사 콘솔(구글·카카오·네이버)에 콜백 주소 등록, 클라이언트 ID는 FE(`NEXT_PUBLIC_*_CLIENT_ID`), **secret은 BE만**. 👤 EH_TODO 4번과 연결.
- [ ] 같은 이메일의 소셜·이메일 계정 정책, 이메일을 못 주는 카카오 계정 처리 → 📮 BE 동작 확인 후 FE 문구 결정(👤).

## 5. 이메일 가입·로그인 (`components/auth-form.tsx`, `lib/email-verification.ts`) 🔧

- [ ] 인증코드 흐름이 **세션 저장 방식이 아니라 증명(proof) 방식**이에요: `POST /auth/email/send-code` → 사용자가 6자리 입력 → `POST /auth/email/verify`가 **일회성 증명**(`challengeId` 등)을 줌 → `POST /auth/signup`(또는 `/auth/password/reset`)에 그 증명을 제출. 필드명은 BE `AUTH_API.md`.
- [ ] 정책값(개발 기본값, 운영 확정 전): 코드 6자리, 코드 유효 5분, 증명 유효 10분, 시도 5회, 재전송 60초 뒤, 시간당 5회. **화면의 타이머·재전송 버튼 값은 하드코딩하지 말고** 응답값 또는 상수 1곳에서 관리.
- [ ] `lib/email-verification.ts`의 sessionStorage 가짜 코드 제거, 인증 직후 증명이 만료되기 전에 가입을 끝내야 한다는 안내 필요(10분).
- [ ] 비밀번호 최소 길이 BE 기본 8자 → 현재 FE 검증과 같은지 확인(📮 운영값).
- [ ] 로그인: `POST /auth/login`(이메일+비밀번호) → Access JSON + 쿠키.
- [ ] **새로 필요한 화면**(지금 없음): 비밀번호 재설정(`/auth/password/reset`, 이메일 인증 후 새 비밀번호 → 성공 후 다시 로그인), 로그인 화면의 "비밀번호를 잊으셨나요".
- [ ] 약관 버전(`terms-version`, `privacy-version`, 기본 `v1`)과 `/terms`·`/privacy` 문서 버전을 맞추는 방법 👤(법적 내용은 사람이 결정).

## 6. 회원 탈퇴 (신규 화면) 🔧

- [ ] `POST /auth/withdraw`: **현재 비밀번호 + "3개월 보관" 경고 확인** 값을 보냄(필드는 BE 문서). 성공 시 refresh 쿠키가 지워지므로 FE도 상태 정리 후 홈으로.
- [ ] **소셜 가입자**는 비밀번호가 없으므로 먼저 `POST /auth/social/reauth`로 제공사 재인증(`mac_social_reauth` 쿠키, 5분) → 그다음 withdraw. 재인증은 로그인된 상태에서 하는 별도 소셜 팝업 흐름이에요.
- [ ] 탈퇴는 즉시 삭제가 아니라 **3개월 보관 후 정리**(자동 정리 작업은 BE에서 아직 꺼져 있음 `MEMBER_PURGE_ENABLED=false`). 안내 문구는 👤 정책 확정 후 작성.
- [ ] 마이페이지 어디에 둘지(디자인) 👤.

## 7. 저장(데이터셋·차트) — 가장 큰 변경 🔧

현재 `lib/saved.ts`는 브라우저에 "데이터셋 폴더 → 차트들"을 통째로 저장해요. BE는 **데이터(표)와 차트 설정(figure)을 분리**하고, **revision으로 낙관적 잠금**을 합니다.

> **구현 현황(2026-11-25)**: `lib/saved-sync.ts`가 로컬 저장 직후 서버로 **미러링**해요(`isMock=false`일 때만). 첫 저장 → `POST /datasets`(multipart, `Idempotency-Key`), 이후 데이터 변경 → `PATCH /datasets/{id}`, 차트 변경 → `PATCH /charts/{id}`(multipart), revision은 폴더의 `sync` 필드에 저장, 요청은 한 번에 하나씩 직렬 처리, 409는 안내만. 화면은 아직 로컬 저장본을 기준으로 해요(BE에 목록·상세·삭제가 없어서). **한계**: 폴더의 두 번째 차트는 서버로 못 보내요(BE에 차트 추가 API 없음, 저장 시 안내), 썸네일은 아직 안 보내요, 열 이름이 비었거나 겹치면 서버 저장을 건너뛰고 안내해요. 임시 서버로 POST→PATCH(revision 1→2)까지 확인했고 실제 BE는 미검증이에요.

### 7-1. 만들기 `POST /datasets` (multipart)
- [ ] 헤더 **`Idempotency-Key`**(요청마다 새 UUID, **재시도 시 같은 키 재사용**) — 네트워크 오류로 두 번 눌려도 중복 생성이 안 돼요.
- [ ] `command` 파트(JSON): `{ name, dataSchemaVersion: 1, data, firstChart: { title, chartType, figureSchemaVersion, figure } }`
- [ ] 선택 파트 `thumbnail`: 차트 PNG(§7-4).
- [ ] 응답: `datasetId, datasetRevision, chartId, chartRevision, createdAt` → **revision을 반드시 저장**(다음 수정에 필요).

### 7-2. 수정 `PATCH /datasets/{id}`(JSON), `PATCH /charts/{id}`(multipart)
- [ ] 둘 다 `expectedRevision`(문자열)을 보냄. 응답의 새 revision으로 갱신해야 다음 자동 저장이 성공.
- [ ] 데이터셋 수정: `{ expectedRevision, name?, dataSchemaVersion?, data? }` → 응답 `invalidatedThumbnailCount`(데이터가 바뀌면 그 데이터셋 차트 썸네일이 무효화됨 → 마이페이지 썸네일 다시 올려야 함).
- [ ] 차트 수정: `command` 파트 `{ expectedRevision, title?, chartType?, figureSchemaVersion?, figure? }` + 선택 `thumbnail`. **`figure`와 `figureSchemaVersion`은 함께** 보내거나 둘 다 생략.
- [ ] **409(revision 충돌)** 처리: 다른 기기/탭에서 먼저 저장한 경우. 사용자에게 "다른 곳에서 바뀌었어요" 안내 + 최신본 불러오기/덮어쓰기 선택. (BE의 정확한 충돌 코드는 §8 확인)
- [ ] 현재의 1분 자동 저장과 `datasetSame/chartSame` 변경 감지 ✅ 유지. **바뀐 게 없으면 요청을 안 보내는 규칙** 유지. 데이터만 바뀌었으면 dataset PATCH만, 차트만 바뀌었으면 chart PATCH만.
- [ ] 저장 중 중복 요청 방지(이전 PATCH 응답 전에 다음 PATCH를 보내면 revision이 어긋남 → 직렬화).

### 7-3. 데이터·figure 모양과 BE 검증 (실패하면 400/413)
- [ ] `data` = `{ "headers": string[], "rows": (string|number|boolean|null)[][] }` — **헤더는 비어 있지 않은 고유 문자열**, 모든 행의 칸 수 = 헤더 수. 중복 헤더·빈 헤더가 있는 파일은 **저장 전에 FE에서 정리/안내**해야 해요(BE가 `INVALID_DATA_SCHEMA`로 거절). 한계: 열 1,000 · 행 100,000 · 셀 문자열 10,000자 · 헤더 255자.
- [ ] 이름·제목은 **앞뒤 공백 제거 후** 보내기(`INVALID_DATASET_NAME`, `INVALID_CHART_TITLE`). 데이터셋 이름 최대 120자, 차트 제목 최대 255자, chartType 최대 30자.
- [ ] `chartType`은 FE 한글 이름(`ChartDefinition.type`, 예: `'도넛 차트'`) 그대로 보내도 되는지, 코드값으로 바꿀지 👤+📮 합의.
- [ ] `figure` = `ChartSpec`(JSON 객체, 최대 **1MB**, 깊이 32). **`figureSchemaVersion`을 FE가 소유**해요: `lib/chart-spec.ts`의 `FIGURE_SCHEMA_VERSION = 1` 상수(추가됨)를 쓰고, 필드 구조를 깨는 변경 때 올리며 옛 버전은 읽을 때 변환(지금은 "기본값 자동 채움"으로 충분). 
- [ ] 크기 초과 코드: `DATASET_TOO_LARGE`(413), `FIGURE_TOO_LARGE`(413). 사용자 한도(10MB/30MB)와 구분해 안내.
- [ ] 큰 파일(수만 행)은 JSON이 커서 느림 → 업로드 한도 10MB와 JSON 크기가 다를 수 있음(JSON이 더 커질 수 있음). 한도 검사는 **JSON 직렬화 후 바이트**로. 이 값은 `lib/limits.ts`의 용량 계산(`overStorageLimit`)과 같은 기준인지 확인.

### 7-4. 썸네일
- [ ] 차트 SVG → PNG(기존 `lib/export.ts` 재사용)를 `thumbnail` 파트로. 최대 10MB(`THUMBNAIL_MAX_BYTES`)지만 마이페이지용이므로 **작게(예: 가로 600px 안팎)** 만들어 올리는 걸 권장. 크기·형식 👤+📮.
- [ ] 응답의 `thumbnailState`를 보고 마이페이지에서 썸네일 없음/처리 중/준비 완료를 구분.
- [ ] 썸네일은 **private S3**. 이미지를 어떻게 읽는지(서명 URL 응답 등)는 BE에서 아직 정해지지 않았을 수 있음 📮.

### 7-5. BE에 아직 없는 것 (IMPLEMENTATION_STATUS 기준, 현재 생성·수정만 구현) 📮
마이페이지가 동작하려면 아래가 필요해요. BE 팀에 일정 확인:
- [ ] **목록 조회**(내 데이터셋 + 차트 목록, 썸네일 주소 포함)
- [ ] **상세 조회**(데이터 + 차트 figure + 최신 revision) — "열기"와 새로고침 복원에 필요
- [ ] **데이터셋 삭제 / 차트 삭제** (삭제 확인 모달 ✅ 이미 있음)
- [ ] **기존 데이터셋에 차트 추가**(데이터셋 폴더 아래 여러 차트를 쌓는 현재 제품 규칙 때문에 필요)
- [ ] **용량·한도·사용량 조회**(`GET /me` 또는 별도). 이게 없으면 마이페이지의 "사용 중 n MB / 30MB"를 서버 값으로 못 보여줘요(지금 6-6 항목).
- [ ] 이름 변경, 차트 복제, 정렬 기준(최근 수정순 등)

### 7-6. 비회원·로그인 전환 👤
- [ ] 비회원은 업로드 5MB, **저장 불가**(로그인 필요 안내 ✅ 현재 규칙). 로그인 직후 작업 중이던 차트를 어떻게 이어서 저장할지(현재 workspace → 로그인 → 저장) 흐름 유지 확인.
- [ ] **기존 localStorage에 저장된 데이터**(`mac-studio:saved:v3:*`)를 서버로 옮길지, 버릴지 👤. 지금은 데모 데이터라 버려도 되지만 배포 전 확인.

## 8. BE에 확인할 질문 목록 📮

BE 문서/코드만으로 확정 못한 것:

1. `GET /me`(내 정보·한도·사용량) 계획이 있는지, 없다면 한도는 어디서 받는지.
2. revision 충돌 시 HTTP 상태·`code` (409 + 코드명), 충돌 응답에 최신 revision이 오는지.
3. `Idempotency-Key` 유효 기간, 같은 키로 다른 본문을 보냈을 때 응답(409/422?).
4. 썸네일 읽기 방식(서명 URL? 프록시?) 그리고 허용 형식(PNG/JPEG/WebP)·권장 크기.
5. `chartType` 허용값(한글 이름 그대로 허용? 화이트리스트?).
6. 약관 동의 필드 모양(`agreedTerms` 타입 값, 버전 포함 여부)과 운영 약관 버전 갱신 방식.
7. 운영 정책 확정값: Access/Refresh 수명, 비밀번호 규칙, 이메일 발송 한도. (현재 BE 값은 "개발용 기본값")
8. 이메일 발송 환경(`MAIL_FROM`, 발송 서비스)과 개발 환경에서 코드를 확인하는 방법(로그? 고정 코드?).
9. 소셜: 카카오 이메일 미제공 계정 처리, 같은 이메일 중복 시 응답 코드.
10. 로컬에서 FE가 붙을 BE 실행 방법(Swagger 켜는 법, MySQL 준비물) — FE 팀원용 한 장짜리 안내.

## 9. 연동 순서(권장)

1. **§1 환경 + §2 API 클라이언트** — Bearer/refresh/`X-Requested-With`. mock을 켜고 끄는 스위치(`NEXT_PUBLIC_API_BASE` 유무)는 유지.
2. **§3 세션 복원 + §5 이메일 가입/로그인** — BE 로컬에 붙여서 가입→로그인→새로고침 복원→로그아웃.
3. **§4 소셜 로그인** — 키 발급 후(👤) Google 하나로 먼저 검증, 카카오·네이버 순.
4. **§7-1 저장(생성)** → **§7-2 자동 저장(PATCH, revision)** — 목록/상세는 BE 일정에 맞춰.
5. **§6 탈퇴**, 비밀번호 재설정 화면.
6. mock 코드 정리(TODO 6-7).

## 10. 연동 후 확인 (AI가 못 하는 것 👤)

- [ ] 실제 BE에 붙여 가입·로그인·새로고침 복원·로그아웃을 브라우저에서 확인(쿠키가 저장되고 Application 탭에서 `mac_refresh`가 HttpOnly로 보이는지).
- [ ] 두 탭에서 동시에 저장했을 때 충돌 안내가 나오는지.
- [ ] 네트워크를 끊고 저장 → 복구 후 재시도에서 **중복 생성이 없는지**(Idempotency-Key).
- [ ] 배포 환경(HTTPS, 실제 도메인)에서 쿠키·CORS·소셜 콜백이 동작하는지(로컬과 다름).
- [ ] 큰 파일(10MB 근처)의 저장 시간과 오류 안내.

## 참고: 파일별 영향

| FE 파일 | 바뀌는 내용 |
| --- | --- |
| `lib/api-client.ts` | Bearer, `X-Requested-With`, 401→refresh, `ApiError.code` |
| `lib/auth.ts`, `lib/auth-api.ts` | 서버 세션 복원, mock 계약을 BE 계약으로 교체, `acceptTerms` 제거 |
| `lib/social-auth.ts`, `components/social-callback.tsx` | 200/202 분기, 가입 마무리, state/PKCE 값 전달 |
| `components/auth-form.tsx`, `lib/email-verification.ts` | 증명(proof) 방식 인증, signup/login API |
| `lib/saved.ts`, `app/studio/editor/page.tsx`, `app/mypage/page.tsx` | datasets/charts API, revision·Idempotency-Key, 썸네일, 목록·삭제 |
| `lib/chart-spec.ts` | `FIGURE_SCHEMA_VERSION` 상수 |
| `lib/limits.ts` | 서버 한도 값으로 교체 가능하게 |
| `lib/storage-cleanup.ts`, `lib/storage-keys.ts` | 서버 저장으로 옮긴 뒤 계정별 저장 정리 제거 |
| (신규) 비밀번호 재설정·탈퇴 화면 | `SITE_PAGES`(`lib/seo.ts`)에 먼저 추가, 로그인 후 화면은 `index: false` |
