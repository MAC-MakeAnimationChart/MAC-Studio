# 검색엔진 최적화(SEO) 가이드

MAC Studio의 검색 노출 설정이 **어디에 있고, 무엇이 끝났고, 사람이 무엇을 해야 하는지** 정리한 문서입니다.
이 문서와 코드만 보고 이어서 작업할 수 있게 쓰였습니다. AI에게 작업을 시킬 때는
[CLAUDE.md](../CLAUDE.md)의 "검색엔진 최적화(SEO) 규칙"도 함께 읽게 하세요.

---

## 1. 한눈에 보기

| 설정 | 파일 | 하는 일 |
| --- | --- | --- |
| **모든 페이지 정보의 원본** | `lib/seo.ts` | 사이트 주소, 사이트 이름, 페이지별 제목·설명·색인 여부·수정일. 아래 파일들이 모두 여기서 만들어집니다. |
| 사이트맵 | `app/sitemap.ts` → `/sitemap.xml` | `SITE_PAGES` 중 `index: true`인 페이지 |
| robots | `app/robots.ts` → `/robots.txt` | 크롤러가 들어오면 안 되는 경로, 사이트맵 주소 |
| 공유 이미지 (OG) | `app/opengraph-image.tsx` → `/opengraph-image` | 링크를 공유할 때 보이는 1200×630 그림. 빌드 때 한 번 그려서 정적 파일로 제공 |
| 앱 정보 (manifest) | `app/manifest.ts` → `/manifest.webmanifest` | 홈 화면에 추가할 때 이름·색 |
| 사이트 공통 메타데이터 | `app/layout.tsx` (`LAYOUT_METADATA`) | `metadataBase`, 제목 템플릿, 기본 설명, 공유 정보, 사이트 소유 확인 코드 |
| 페이지별 메타데이터 | 각 `page.tsx` (`pageMetadata("/경로")`) | 제목, 설명, canonical, 공유 정보, noindex |
| 구조화 데이터 (JSON-LD) | `components/json-ld.tsx`, `app/page.tsx`, `components/breadcrumb.tsx` | 홈: Organization · WebSite · WebApplication, 안쪽 페이지: BreadcrumbList |
| 빵부스러기 (breadcrumb) | `components/breadcrumb.tsx` | 화면의 "홈 › 현재 페이지"와 같은 내용의 검색엔진용 데이터 |
| 404 페이지 | `app/not-found.tsx` | 없는 주소. 404 상태로 응답하고 검색 결과에서 제외, 돌아갈 링크 제공 |
| 분석(GA4) | `components/analytics.tsx` | `NEXT_PUBLIC_GA_ID`가 있을 때만 켜지는 Google Analytics |
| 점검 스크립트 | `scripts/seo-check.mjs` (`npm run seo:check`) | 실행 중인 사이트가 검색엔진에게 어떻게 보이는지 자동 점검 |

색인할 페이지: `/`, `/studio`, `/guide`, `/terms`, `/privacy`
색인하지 않는 페이지(noindex): `/login`, `/signup`, `/mypage`, `/studio/editor`, `/studio/loading`, `/auth/*`

---

## 2. 체크리스트 현황

범례: ✅ 코드로 끝남 · 👤 사람이 해야 함 · ➖ 지금은 해당 없음 · ⚠️ 부분만 됨/확인 필요

### 1. 크롤링·색인
| 항목 | 상태 | 내용 |
| --- | --- | --- |
| `app/sitemap.ts` | ✅ | 정적 페이지 5개. 동적 공개 페이지는 아직 없음. `lastModified`는 `SITE_PAGES`의 수정일(수동 관리, 3번의 "페이지 내용을 고쳤을 때" 참고) |
| `app/robots.ts` | ✅ | `/api/`, `/auth/`, `/mypage`, `/studio/editor`, `/studio/loading` 차단 + Sitemap 주소. Vercel 미리보기 배포는 전체 차단 |
| Google Search Console 등록·사이트맵 제출 | 👤 | 5번 참고 |
| Naver Search Advisor 등록·사이트맵·수집 요청 | 👤 | 5번 참고. RSS는 블로그 같은 피드가 없어 제출할 것이 없음(➖) |
| HTTPS, HTTP→HTTPS 301 | ✅/👤 | Vercel이 자동으로 처리. 도메인을 연결한 뒤 실제로 리다이렉트되는지 확인 필요 |
| www / non-www 통일 | 👤 | Vercel → Settings → Domains에서 한쪽을 다른 쪽으로 Redirect 설정 |
| 페이지별 canonical | ✅ | `pageMetadata()`가 색인 페이지에 `alternates.canonical`을 넣음 |
| 404 처리, 삭제 페이지 301 | ✅/➖ | `app/not-found.tsx` 완료. 지금까지 삭제한 공개 페이지가 없어 301 대상 없음. 생기면 3번의 "페이지를 옮기거나 지울 때" 참고 |
| noindex | ✅ | `index: false` 페이지는 `robots: noindex, nofollow`. 클라이언트 페이지는 옆의 `layout.tsx`가 대신 내보냄 |
| SSR/SSG | ✅ | 모든 공개 페이지가 빌드 때 정적 HTML로 만들어지고 본문이 HTML에 들어 있음(`seo:check`가 `<h1>`과 JSON-LD로 확인) |

### 2. 메타데이터
| 항목 | 상태 | 내용 |
| --- | --- | --- |
| `metadataBase`, `title.template`, 기본 설명 | ✅ | `lib/seo.ts`의 `LAYOUT_METADATA` → `app/layout.tsx` |
| 페이지별 고유 title | ✅ | 가장 긴 것이 35자. 한글은 글자 폭이 넓어 검색 결과에서 약 30자 안팎에서 잘리므로 짧게 유지 |
| 페이지별 고유 description (120~155자) | ✅ | 색인 페이지 5개 모두 120~137자. `seo:check`가 길이를 검사 |
| 동적 라우트 `generateMetadata` | ➖ | 색인할 동적 페이지가 없음. 생기면 같은 `lib/seo.ts` 방식으로 `generateMetadata` 작성 |
| Open Graph (1200×630, `ko_KR`) | ✅ | 모든 페이지. 이미지는 `app/opengraph-image.tsx` |
| Twitter Card | ✅ | `summary_large_image` |
| `<html lang="ko">` | ✅ | `app/layout.tsx` |
| favicon, apple-touch-icon, manifest | ✅/⚠️ | 탭 아이콘(32px), 애플 아이콘(180px), manifest 모두 있음. manifest에 192×192 / 512×512 아이콘이 없어 "앱으로 설치" 조건은 아직 부족(7번) |

### 3. 페이지 구조·콘텐츠
| 항목 | 상태 | 내용 |
| --- | --- | --- |
| 페이지당 H1 1개 | ✅ | 색인 페이지 5개 모두 H1이 정확히 1개(`seo:check`). 편집·마이페이지 등 로그인 후 화면은 색인 대상이 아님 |
| 시맨틱 태그 | ✅ | `header`, `nav`, `main`, `footer`, 빵부스러기는 `nav > ol` |
| URL 슬러그 | ✅ | `/studio`, `/guide`, `/terms`, `/privacy`: 짧고 소문자 |
| 내부 링크 | ✅ | `next/link` 사용. 헤더·푸터에서 모든 공개 페이지에 1클릭 |
| 3클릭 이내 | ✅ | 모든 공개 페이지가 홈에서 1~2클릭 |
| 고유 콘텐츠 | 👤 | 콘텐츠 자체는 사람이 늘려야 함. 아이디어: 차트 종류별 설명 페이지, 데이터 정리 가이드 확장(7번) |
| breadcrumb | ✅ | `/guide`, `/terms`, `/privacy`는 화면 + 데이터. `/studio`는 데이터만(화면 구성상 자리 없음) |

### 4. 이미지·미디어
| 항목 | 상태 | 내용 |
| --- | --- | --- |
| `next/image` | ✅ | 사이트의 비트맵 이미지는 헤더 로고 하나이고 `next/image` 사용(`priority`). 차트는 SVG |
| alt | ✅ | 로고는 옆 글자 "MAC Studio"가 링크 이름이라 `alt=""`(장식) |
| width/height, CLS | ✅ | 로고에 크기 지정 |
| LCP 이미지 | ✅ | 홈에서 가장 큰 요소는 제목 글자일 가능성이 높음(측정 전). 로고만 `priority` |

### 5. 구조화 데이터
| 항목 | 상태 | 내용 |
| --- | --- | --- |
| Organization / WebSite | ✅ | 홈(`app/page.tsx`). 공식 SNS 주소가 생기면 `sameAs`에 추가(주석 자리 있음) |
| 페이지 성격별 스키마 | ✅/➖ | WebApplication(홈), BreadcrumbList(안쪽 페이지). Article, Product, LocalBusiness, FAQ는 해당 콘텐츠가 없어 넣지 않음(없는 내용을 표시하면 안 됨) |
| Rich Results Test 검증 | 👤 | 배포 후 5번 E의 도구로 확인 |

### 6. 성능 (Core Web Vitals)
| 항목 | 상태 | 내용 |
| --- | --- | --- |
| LCP·INP·CLS 목표 | 👤 | **측정하지 않았습니다.** 배포 후 PageSpeed Insights(모바일)로 측정 |
| `next/font` | ✅ | 에스코어 드림을 `next/font/local`로 불러옴(`display: swap`) |
| `next/script` | ✅ | 서드파티 스크립트는 GA4뿐이고 기본 꺼짐. 켜면 `afterInteractive` |
| 번들 크기 | 👤 | 점검 전. 새 라이브러리를 추가하지 않는 것이 원칙 |

### 7. 모바일·접근성
| 항목 | 상태 | 내용 |
| --- | --- | --- |
| viewport, 반응형 | ✅ | Next 기본 viewport + 모바일 메뉴 |
| 터치 요소 크기 | ⚠️ | 일부 작은 버튼(11~12px 글자)이 있어 점검 필요 |
| 팝업 | ✅ | 콘텐츠를 가리는 팝업·쿠키 배너 없음 |
| 색 대비·키보드 | ⚠️ | 키보드 포커스 이동은 모달·메뉴에서 처리됨. 색 대비는 정식 점검 전 |

### 8. 외부 신호·로컬
| 항목 | 상태 | 내용 |
| --- | --- | --- |
| 백링크, SNS 연결 | 👤 | 코드로 할 수 없음 |
| Google 비즈니스 프로필 / 네이버 플레이스 | ➖ | 오프라인 매장 없음 |
| 상호·주소·전화번호 일치 | 👤 | `lib/company.ts`가 비어 있음. 채우면 푸터에 표시되므로, 다른 채널과 똑같이 적을 것 |

### 9. 배포 후 모니터링
| 항목 | 상태 | 내용 |
| --- | --- | --- |
| Search Console 주 1회 확인 | 👤 | 색인 범위, 쿼리·CTR·순위, Core Web Vitals |
| 빌드 시 sitemap 자동 재생성 | ✅ | `app/sitemap.ts`가 빌드마다 `SITE_PAGES`에서 새로 만듦. 확인: `npm run seo:check` |
| GA4 | ✅/👤 | 코드는 준비됨. 켜는 방법은 5번 |
| `site:도메인` 검색으로 색인 수 대조 | 👤 | 색인 페이지는 5개가 정상 |

---

## 3. 새 공개 페이지를 추가할 때

1. `lib/seo.ts`의 `SITE_PAGES`에 항목을 추가합니다. (`path`, `title`, `description`, `index`, `lastModified`, `changeFrequency`, `priority`)
   - 색인할 페이지: `index: true`, 설명은 **120~155자**, 제목은 짧게(한글 30자 안팎)
   - 색인하지 않을 페이지(로그인 후 화면 등): `index: false`
2. 페이지 파일에서 `export const metadata = pageMetadata("/경로");` 한 줄을 씁니다.
   - 페이지가 `"use client"`라서 `metadata`를 내보낼 수 없으면, 같은 폴더에 `layout.tsx`를 만들고 거기서 내보냅니다(`app/mypage/layout.tsx` 참고).
3. 페이지에 `<h1>`을 **하나만** 둡니다. `<main>` 안에 만들고, 소제목은 `<h2>`부터 차례로.
4. 안쪽 페이지라면 `<Breadcrumb trail={[{ name: "페이지 이름", path: "/경로" }]} />`를 맨 위에 둡니다.
5. 사이트맵은 자동입니다. `app/sitemap.ts`를 고칠 필요가 없습니다.
6. 색인하지 않는 페이지가 **로그인·결제 같은 실제 사용 화면**이면 `app/robots.ts`의 `disallow`에도 경로를 추가합니다. 반대로 `noindex`만 걸고 크롤은 허용해야 하는 페이지(예: 로그인)는 `disallow`에 넣지 않습니다. 크롤러가 `noindex`를 읽을 수 있어야 하기 때문입니다.
7. `scripts/seo-check.mjs`의 `PRIVATE_PATHS`를 `index: false` 페이지와 맞춥니다.
8. `npm run build` 후 `npm start`로 띄우고 `npm run seo:check`를 실행해 모두 통과하는지 봅니다.

### 페이지 내용을 고쳤을 때
- 그 페이지의 `lastModified`(`lib/seo.ts`)를 **내용을 바꾼 날짜**로 고칩니다. 배포할 때마다 오늘 날짜로 바꾸지 마세요. 검색엔진이 날짜를 믿지 않게 됩니다.

### 페이지를 옮기거나 지울 때
- `next.config.ts`에 301 이동을 추가하고 `SITE_PAGES`에서 옛 경로를 지웁니다.
  ```ts
  async redirects() {
    return [{ source: "/옛-주소", destination: "/새-주소", permanent: true }];
  },
  ```

---

## 4. 환경 변수

`.env.example`에 모두 적혀 있습니다. Vercel에서는 Settings → Environment Variables에 넣습니다.

| 이름 | 용도 | 비어 있으면 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 사이트의 진짜 주소(예: `https://example.com`, 끝에 `/` 없이). canonical, 사이트맵, 공유 정보에 쓰임 | Vercel이 자동으로 주는 `VERCEL_PROJECT_PRODUCTION_URL`(`xxx.vercel.app`)을 쓰고, 그것도 없으면 `http://localhost:3000` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console 소유 확인 코드 | 태그를 넣지 않음 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | 네이버 서치어드바이저 소유 확인 코드 | 태그를 넣지 않음 |
| `NEXT_PUBLIC_GA_ID` | GA4 측정 ID(`G-XXXXXXXXXX`) | GA를 불러오지 않음 |

> **도메인이 정해지면 `NEXT_PUBLIC_SITE_URL`을 꼭 설정하세요.** 설정하지 않은 채 도메인을 바꾸면 canonical과 사이트맵이 옛 주소를 가리킵니다.

> **Vercel 미리보기 배포(`VERCEL_ENV=preview`)는 자동으로 noindex + robots 전체 차단**입니다. 미리보기 주소가 검색에 잡히는 것을 막기 위함입니다. 로컬 `npm run build`는 운영과 같게 동작해서 결과를 확인할 수 있습니다.

---

## 5. 배포 후 사람이 할 일 (순서대로)

### A. 도메인과 주소 정리
1. 사용할 도메인을 정하고 Vercel에 연결합니다.
2. www와 non-www 중 하나를 정해 다른 쪽을 Redirect로 설정합니다.
3. `NEXT_PUBLIC_SITE_URL`을 그 주소로 설정하고 다시 배포합니다.
4. `npm run seo:check -- https://실제주소`로 운영 사이트를 점검합니다.
5. `http://` 주소로 접속하면 `https://`로 이동하는지 브라우저로 확인합니다.

### B. Google Search Console
1. https://search.google.com/search-console 에서 속성을 추가합니다. (도메인 속성 또는 URL 접두어 속성)
2. "HTML 태그" 방식을 고르면 나오는 `content="…"` 값을 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`에 넣고 재배포한 뒤 "확인"을 누릅니다.
3. 사이트맵 → `sitemap.xml`을 제출합니다.
4. URL 검사에서 홈과 `/studio`의 "색인 생성 요청"을 눌러 봅니다.

### C. 네이버 서치어드바이저
1. https://searchadvisor.naver.com 에서 사이트를 등록합니다.
2. 소유 확인은 HTML 태그의 `content` 값을 `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`에 넣습니다.
3. 요청 → 사이트맵 제출에 `https://실제주소/sitemap.xml`을 넣고, 웹 페이지 수집 요청으로 홈을 요청합니다.
4. RSS 제출은 하지 않습니다(블로그·피드가 없음).

### D. GA4 (선택)
1. GA4에서 측정 ID를 만들고 `NEXT_PUBLIC_GA_ID`에 넣습니다.
2. **먼저 개인정보처리방침에 Google Analytics 사용을 명시**하세요(`app/privacy/page.tsx`). 방문자 정보를 수집하게 되므로 법적 검토가 필요합니다.
3. 배포 후 GA의 실시간 화면에서 방문이 보이는지 확인합니다.

### E. 구조화 데이터 검증
- https://search.google.com/test/rich-results 에서 홈과 `/guide`의 주소를 넣어 오류가 없는지 확인합니다.
- WebApplication은 구글의 "리치 결과" 대상은 아니라서 이 도구에 안 나올 수 있습니다. 문법 확인은 https://validator.schema.org 를 쓰세요.

### F. 정기 확인 (주 1회)
- Search Console: 색인 생성 범위, 성능(쿼리·클릭률·순위), Core Web Vitals, 오류 알림
- `site:실제주소` 검색 결과 수가 5개 안팎인지(로그인·마이페이지 등이 섞여 있으면 noindex 문제)

---

## 6. 점검하는 법

```bash
npm run build && npm start     # 터미널 1: 운영 모드로 실행 (http://localhost:3000)
npm run seo:check              # 터미널 2: 자동 점검
npm run seo:check -- https://실제주소    # 배포된 사이트 점검
```

`seo:check`가 확인하는 것: robots.txt와 사이트맵 응답, 사이트맵에 비공개 페이지가 섞이지 않았는지, 색인 페이지마다
title(60자 이하)·description(120~155자)·canonical·og:image·언어·H1 한 개·JSON-LD 문법, 비공개 페이지의 noindex, 없는 주소의 404.
**하나라도 실패하면 종료 코드 1**을 돌려줍니다. 통과해도 아래는 사람이 봐야 합니다: 속도(PageSpeed Insights), 색 대비, 터치 크기, 구조화 데이터 검증.

> 빌드 중에 "Your version of Next.js is affected by a known security vulnerability" 안내가 나오면 그 빌드는 한 번 실패합니다
> (다시 실행하면 통과). 안내는 사실이므로 `npm audit`로 확인해서 `next`를 패치 버전으로 올리세요(2026-11-23에 16.4.6으로 올려 해소함, `docs/TODO.md` 7-11).

---

## 7. 아직 하지 않은 것

- **PageSpeed/Lighthouse 측정**: 배포 주소가 있어야 정확합니다. 측정 결과로 LCP·INP·CLS를 확인하세요.
- **192×192, 512×512 아이콘**: 있어야 manifest로 "앱 설치"가 됩니다. 디자인 팀에서 받아 `public/`에 넣고 `app/manifest.ts`의 `icons`에 추가하세요.
- **공유 이미지(OG) 디자인 확정**: 지금은 홈 히어로 색을 쓴 임시 디자인입니다. 디자인이 정해지면 `app/opengraph-image.tsx`를 고치거나 같은 폴더에 `opengraph-image.png`(1200×630)를 두세요(이미지 파일이 있으면 그것이 쓰이므로 `.tsx`는 지웁니다).
- **`sameAs`(공식 SNS)**: 채널이 생기면 `app/page.tsx`의 Organization에 추가하세요.
- **콘텐츠 확장**: 검색 유입은 결국 글 내용에서 나옵니다. 차트 종류별 설명, 데이터 정리 가이드를 늘리면 좋습니다(키워드를 억지로 반복하지 말 것).
- **`/studio`의 H1**: 지금 "스튜디오"입니다. "무료 차트 만들기"처럼 검색어가 드러나는 문구가 필요하면 디자인과 상의해서 바꾸세요.
- **터치 요소·색 대비 점검**, **번들 크기 점검**

---

## 8. 자주 하는 실수

- **`robots.txt`로 막은 페이지에 `noindex`를 걸어 두기**: 막으면 크롤러가 `noindex`를 읽지 못합니다. 색인에서 빼고 싶은 공개 페이지는 막지 말고 `noindex`만 쓰세요.
- **페이지에서 `openGraph`를 직접 쓰기**: 레이아웃의 값을 덮어써서 이미지·언어가 사라집니다. `pageMetadata()`를 쓰세요.
- **주소를 코드에 직접 쓰기**(`https://…`): `SITE_URL`을 쓰세요. 도메인이 바뀌면 한 곳만 고치면 됩니다.
- **`opengraph-image`에서 함수 안에서 `readFile`**: 빌드 때 한 번이 아니라 접속할 때마다 이미지를 만드는 서버 함수로 바뀌어 비용이 생깁니다. 파일 읽기는 모듈 맨 위에서 하세요(이미 그렇게 되어 있습니다).
- **`lastModified`를 매번 오늘 날짜로**: 3번의 "페이지 내용을 고쳤을 때" 참고.
