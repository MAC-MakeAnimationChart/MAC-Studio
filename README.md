# 🎨 MAC (Make A Chart)

> 비개발자를 위한 한국형 No-Code 시각화 웹서비스

---

## 🧭 Overview

MAC은 데이터 파일(CSV·XLSX)을 올리기만 하면
누구나 빠르게 차트를 만들고 다듬어서 이미지로 내려받을 수 있는 **시각화 편집 도구**입니다.

기존 복잡한 분석 툴과 달리,
**단계형 사용자 흐름**을 통해 비전공자도 쉽게 결과물을 만들 수 있도록 설계되었습니다.

이 저장소는 그중 무료 버전인 **MAC Studio**입니다.

| 제품 | 대상 | 상태 |
| --- | --- | --- |
| **MAC Studio** | 무료 · 가볍게 차트를 만들고 싶은 모든 사용자 | 이 저장소에서 개발 중 |
| **MAC Expert** | 유료 · 더 많은 차트와 고급 기능이 필요한 사용자 | 기획 단계, 별도 개발 범위 |

---

## 🎯 Core Message

> **MAC은 전문가용 분석 툴이 아니다.**

MAC은
👉 데이터를 빠르게 시각화하고
👉 원하는 스타일로 쉽게 수정할 수 있도록 돕는

**한국형 No-Code 시각화 편집기**를 목표로 합니다.

---

## 🚀 Goal

* 차트 생성 → 편집 → 저장 → 다운로드까지 이어지는 Studio 완성
* 이후 MAC Expert(유료)로 차트 종류와 기능 확장
* 베타 출시 일정은 확정되는 대로 이 문서에 기록합니다.

---

## ⚠️ Problem

기존 시각화 도구들은

* 영어 중심 UI
* 복잡한 설정 구조
* 과도한 선택지 제공

👉 **비전공자가 사용하기 어려움**

---

## ✅ Solution

MAC Studio는 아래와 같은 흐름으로 문제를 해결합니다:

```
데이터셋 업로드 → 데이터 확인 → 차트 선택 → 편집 → 추출(이미지·CSV) / 저장
```

* 올린 표가 차트로 만들 수 있는 모양인지 **업로드 직후 점검**하고, 고칠 수 있는 문제는 자동 수정을 제안합니다.
* 차트는 한 번에 **하나씩** 만들고, 저장하면 데이터셋 폴더 아래에 쌓입니다.
* 모든 처리는 **사용자 브라우저 안에서** 이루어져 서버 비용 없이 동작합니다.

👉 사용자는 도구를 배우는 것이 아니라
👉 **단계를 따라 결과물을 만드는 경험**을 하게 됩니다.

---

## 👥 Target Users

### 🎯 타깃

> 발표·과제·숏폼용으로 빠르게 시각화를 만들고 싶은 비전공자

### 📌 주요 사용자

* 🎓 발표 자료가 필요한 대학생
* 📊 엑셀 데이터 기반 시각화가 필요한 사용자
* 📈 데이터는 있지만 디자인이 어려운 사용자
* 🎥 유튜브/숏츠용 Bar Chart Race 제작자 (Expert 이후 지원 예정)

---

## 🌟 Key Features (MAC Studio)

| 번호 | 기능 | 설명 |
| ---- | ---- | ---- |
| 1 | 한글 중심 No-Code | 한글 UI, 에스코어 드림 글꼴, 라이트/다크 모드(브라우저 설정 따름) |
| 2 | 파일 업로드·점검 | CSV(CP949 포함)·XLSX 업로드, 문제 점검과 자동 고치기, `/guide`에 형식 안내·샘플·AI 프롬프트 |
| 3 | 단계형 차트 생성 | 업로드 → 확인 → 차트 선택 → 편집 화면 |
| 4 | 차트 편집 | 제목·부제목·출처, 색상, 배경, 범례, 글꼴, 여백, X축 글자 방향, 행 선택(범위/직접), 정렬·상위 N, 원형 차트 항목별 색·색상 계열 |
| 5 | 추출 | 결과물 JPG·PNG·TIFF(DPI 지정), 데이터셋 CSV |
| 6 | 회원 기능 | 이메일 인증 가입, 데이터셋 폴더 저장, 마이페이지, 1분 자동 저장, 이탈 방지 안내 |
| 7 | 반응형 | 편집 화면은 데스크톱에서 한 화면 고정(옵션 패널만 스크롤), 모바일은 ≡ 메뉴 |

### 🔐 비회원 vs 회원

| | 비회원 | 회원 |
| --- | --- | --- |
| 업로드 용량 | 5 MB | 10 MB |
| 차트 만들기·내보내기 | 가능 | 가능 |
| 내보내기 해상도 | 300 DPI | 300 · 600 DPI |
| 저장 · 마이페이지 | 없음 | 30 MB |

> 용량 수치는 확정 전이며 `lib/limits.ts` 한 곳에서 관리합니다.

### 📊 지원 차트

Studio가 제공할 차트 목록은 28종(`lib/chart-catalog.ts`)이며, 현재 구현된 차트는 아래 3종입니다.

| 차트 | 데이터 구조 | 주요 옵션 |
| --- | --- | --- |
| 막대 차트 | 항목, 값 | 색상 · 막대 두께 · 명암 · 정렬 · 상위 N |
| 선 차트 | 항목(순서), 값 | 색상 · 축 글자 · X축 방향 |
| 원형 차트 | 항목, 값 | 항목별 색 · 색상 계열 · 범례 · 정렬 · 상위 N · "기타" 묶기 |

나머지 차트는 홈의 차트 목록에 "준비 중"으로 표시됩니다.

---

## 🟠 MAC Expert (유료, 기획)

Expert는 별도 개발 범위이며, Studio와 구분되는 브랜딩(검정 + 주황)으로 갑니다. 현재 Studio 화면에서는 안내 문구와 주황 포인트로만 드러납니다.

| 구분 | Studio | Expert |
| --- | --- | --- |
| 가격 | 무료 | 유료 |
| 차트 종류 | 28종 목록 중 단계적 구현 (현재 3종) | Studio 차트를 포함해 총 100종 예정 |
| 내보내기 | JPG · PNG · TIFF · CSV, 300 / 600 DPI(회원) | 1200 DPI 등 고급 옵션 예정 |
| 대표 색상 | 흰색 + 파랑 `#2F66F5` | 검정 + 주황 |

> Expert의 상세 기능·요금은 확정되는 대로 갱신합니다.

---

## 🧩 Template-Based Architecture

차트는 “정의(Definition) 하나 = 차트 하나” 구조로 관리합니다. 새 차트를 추가하려면 파일 하나를 만들고 레지스트리에 등록하면 됩니다.

```
components/charts/
  types.ts        ChartDefinition (이름, 아이콘, 지원 옵션, 컴포넌트)
  registry.ts     제공하는 차트 목록 — 여기에 추가하면 끝
  bar-chart.tsx   차트별 파일 (line-chart, pie-chart …)
  frame.tsx       제목·범례·여백·글꼴 등 모든 차트 공통 틀
  cartesian.tsx   축이 있는 차트의 공통 눈금·축 글자
lib/
  chart-spec.ts   차트 하나의 모든 옵션(ChartSpec)과 기본값
  chart-data.ts   행 선택 → 정렬 → 상위 N 처리
  chart-palette.ts / chart-colors.ts / chart-fonts.ts   색·글꼴 (한 곳에서 교체)
```

### 💡 장점

* 차트 확장 용이 (Studio → Expert 차트 추가 동일 방식)
* 유지보수 효율성 (옵션은 `supports`로 차트마다 켜고 끔)
* FE/BE 협업 구조 통일 (저장되는 것은 `ChartSpec` JSON 하나)

---

## 🛠 Tech Stack

| 구성 | 기술 |
| --- | --- |
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 |
| Chart Engine | 직접 구현한 SVG 차트 (외부 차트 라이브러리 없음) |
| 파일 처리 | CSV 직접 파싱(구분자·CP949 감지), `read-excel-file`(XLSX) |
| UI | lucide-react · sonner(토스트) · 에스코어 드림(사이트 글꼴) |
| 내보내기 | SVG → Canvas 변환으로 JPG·PNG·TIFF 생성(DPI 정보 포함) |
| 저장 | 현재는 브라우저(localStorage / sessionStorage) 데모 구현 |
| Backend / DB | 미연동 — 연동 시 인증·저장 모듈 교체 (기존 검토: Next.js API / FastAPI / Supabase) |
| 배포 | Vercel (정적 프리렌더) |

> 로그인·이메일 인증·저장은 서버가 없는 **데모 구현**입니다. `lib/auth.ts`, `lib/email-verification.ts`, `lib/saved.ts`를 서버 호출로 바꾸면 화면 코드는 그대로 쓸 수 있도록 분리해 두었습니다.

---

## ▶️ Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npm run lint
```

---

## 📌 Development Principles

* 🎯 기능보다 **사용자 흐름 우선**
* 🧩 구조는 단순하게
* 🚀 작은 단위로 빠르게 개발
* 💸 서버 없이 브라우저에서 처리해 **비용 절감**

---

## 👥 Team

| 부서 | 역할 | 이름 |
| ---- | ---- | ---- |
| PO | 🎯 PO | 송형우 |
| BE | 🧑‍💼 팀장 | 김용준 |
| BE | 🧑‍💻 팀원 | 고성민 |
| FE | 🧑‍💼 팀장 | 김태완 |
| FE | 🧑‍💻 팀원 | 정제이 |

---

## 📂 Repository Structure

```
app/          페이지 (/, /studio, /studio/editor, /mypage, /guide, /login, /signup, /terms, /privacy)
components/   화면 조각 (차트, 옵션 패널, 업로드·점검, 헤더·푸터 등)
lib/          차트 옵션·데이터 처리, 파일 파싱, 내보내기, 인증·저장
public/       로고·아이콘
```

---

## 🔥 Workflow

```
Issue 생성 → 브랜치 생성 → 개발 → PR(develop) → Merge → develop → main PR → 배포
```

* 작업 브랜치는 `develop`에서 만들고, 작업이 끝나면 `develop`으로 PR을 올립니다.
* `main`은 배포용입니다. (Vercel이 `main`을 배포)

---

## 📌 Commit Convention

```
feat: 기능 추가
fix: 버그 수정
refactor: 구조 개선
style: UI 변경
docs: 문서 수정
```

---

## 🚀 Vision

MAC은 단순한 차트 생성기를 넘어

👉 **데이터 시각화의 진입장벽을 낮추는 플랫폼**으로 성장하는 것을 목표로 합니다.
