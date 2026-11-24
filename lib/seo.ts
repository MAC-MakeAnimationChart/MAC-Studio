import type { Metadata } from "next";

// The single source of truth for search-engine settings (see docs/SEO.md).
//   - the site address and name
//   - every page of the site, with its title, description and whether search engines may index it
// app/sitemap.ts, app/robots.ts and each page's metadata are all built from SITE_PAGES, so a page
// is described in exactly one place. When you add a page, add it here first.

export const SITE_NAME = "MAC Studio";
export const ORG_NAME = "MAC (Make A Chart)";
export const SITE_LOCALE = "ko_KR";

// Production address, with no trailing slash. Set NEXT_PUBLIC_SITE_URL once the real domain exists.
// Until then Vercel's own production address is used, and localhost when developing.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

// Only the production site may be indexed. Vercel preview deployments (VERCEL_ENV=preview) and
// everything else that is not production get "noindex" and "Disallow: /". Local builds (no VERCEL_ENV)
// behave like production so that the output can be checked.
export const IS_INDEXABLE_DEPLOYMENT =
  !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";

export const SITE_DESCRIPTION =
  "코딩 없이 CSV·엑셀 파일만 올리면 막대·선·원형 차트가 완성돼요. 제목·색상·범례를 다듬어 JPG·PNG·TIFF로 바로 내려받는 무료 차트 만들기 도구, MAC Studio예요. 파일은 서버로 보내지 않고 내 브라우저 안에서만 처리돼요.";

export type SitePage = {
  path: string;
  // Used as the tab title and search result title. The site name is added by the title template
  // (title.template in app/layout.tsx), except for the home page, which sets the whole title.
  title: string;
  // 120-155 characters for pages that are indexed. Shown under the title in search results.
  description: string;
  // false: the page is for signed-in users or for the app itself, not for search (sitemap leaves it
  // out and the page says noindex).
  index: boolean;
  // Last day the page's CONTENT changed (YYYY-MM-DD). Update it when you change the page's text, not
  // for every deploy; search engines learn to ignore dates that are always "today".
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};

export const SITE_PAGES: SitePage[] = [
  {
    path: "/",
    title: "MAC Studio – 무료 차트 만들기, CSV·엑셀을 차트로",
    description: SITE_DESCRIPTION,
    index: true,
    lastModified: "2026-11-23",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/studio",
    title: "무료 차트 만들기 스튜디오",
    description:
      "CSV·엑셀 파일을 올리고 차트를 하나 고르면, 편집 화면에서 제목·색상·범례·글꼴·여백까지 다듬어 JPG·PNG·TIFF로 내려받을 수 있어요. 회원가입 없이 바로 시작하는 무료 차트 만들기 스튜디오이고, 파일은 내 브라우저 안에서만 처리돼요.",
    index: true,
    lastModified: "2026-11-23",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/guide",
    title: "차트용 데이터 표 만드는 법",
    description:
      "차트가 잘 그려지는 표 모양과 자주 생기는 문제의 해결법, 차트별로 필요한 데이터, 내려받아 쓸 수 있는 샘플 CSV, AI에 표 정리를 맡기는 프롬프트까지 한곳에 모았어요. 엑셀 차트를 만들기 전에 확인해 보세요.",
    index: true,
    lastModified: "2026-11-23",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/terms",
    title: "이용약관",
    description:
      "MAC Studio 서비스의 이용약관이에요. 서비스 이용 조건, 회원과 서비스의 권리와 의무, 책임의 범위, 계정과 저장한 데이터의 관리 같은 내용을 안내해요. 정식 공개 전에 약관 내용이 확정되면 이 페이지에 게시해요.",
    index: true,
    lastModified: "2026-11-23",
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    path: "/privacy",
    title: "개인정보처리방침",
    description:
      "MAC Studio가 어떤 개인정보를 어떻게 모으고 쓰고 보관하는지 안내하는 개인정보처리방침이에요. 업로드한 파일은 서버로 보내지 않고 내 브라우저 안에서만 처리돼요. 정식 공개 전에 내용이 확정되면 이 페이지에 게시해요.",
    index: true,
    lastModified: "2026-11-23",
    changeFrequency: "yearly",
    priority: 0.2,
  },
  // ---- not for search: sign-in and the working screens of the app ----
  {
    path: "/login",
    title: "로그인",
    description: "MAC Studio에 로그인해서 저장한 데이터셋과 차트를 불러오세요.",
    index: false,
  },
  {
    path: "/signup",
    title: "회원가입",
    description:
      "MAC Studio에 가입하면 데이터셋과 차트를 저장하고 마이페이지에서 다시 편집할 수 있어요.",
    index: false,
  },
  {
    path: "/mypage",
    title: "마이페이지",
    description: "저장한 데이터셋과 차트를 모아 보고 다시 편집해요.",
    index: false,
  },
  {
    path: "/studio/editor",
    title: "차트 편집",
    description: "차트의 제목, 색상, 범례를 다듬고 이미지로 내려받아요.",
    index: false,
  },
  {
    path: "/studio/loading",
    title: "차트를 만드는 중",
    description: "차트를 만들고 있어요. 잠시만 기다려 주세요.",
    index: false,
  },
];

// The share picture (app/opengraph-image.tsx, drawn at build time). A page's own openGraph replaces the
// layout's instead of merging with it, and a picture file is only picked up for its own folder, so
// every page lists the picture itself (the home page gets it from the file next to app/page.tsx).
const SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "MAC Studio – 데이터를 올리면, 차트가 완성돼요",
};

const PAGE_BY_PATH = new Map(SITE_PAGES.map((p) => [p.path, p]));

export function getSitePage(path: string): SitePage {
  const page = PAGE_BY_PATH.get(path);
  if (!page)
    throw new Error(
      `lib/seo.ts: "${path}" is not in SITE_PAGES. Add it there first.`,
    );
  return page;
}

// What a page's `metadata` export should be: `export const metadata = pageMetadata("/guide")`.
// Open Graph is repeated here because a page's openGraph replaces the layout's instead of merging
// with it. The picture comes from app/opengraph-image.tsx.
export function pageMetadata(path: string): Metadata {
  const page = getSitePage(path);
  const title = path === "/" ? { absolute: page.title } : page.title;
  const social = {
    title: page.title,
    description: page.description,
  };
  return {
    title,
    description: page.description,
    // noindex pages get no canonical: there is nothing to consolidate
    alternates: page.index ? { canonical: path } : undefined,
    robots: page.index ? undefined : { index: false, follow: false },
    openGraph: {
      ...social,
      type: "website",
      url: path,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      ...(path === "/" ? {} : { images: [SHARE_IMAGE] }),
    },
    twitter: {
      card: "summary_large_image",
      ...social,
      ...(path === "/" ? {} : { images: [SHARE_IMAGE] }),
    },
  };
}

// Site-wide values for app/layout.tsx.
export const LAYOUT_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: { default: SITE_PAGES[0].title, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    title: SITE_PAGES[0].title,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_PAGES[0].title,
    description: SITE_DESCRIPTION,
  },
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  // not production (a Vercel preview): keep it out of search results
  robots: IS_INDEXABLE_DEPLOYMENT ? undefined : { index: false, follow: false },
  // Site ownership codes from Google Search Console / Naver Search Advisor (see docs/SEO.md). Only
  // written into the page when the environment variable is set.
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? {
          other: {
            "naver-site-verification":
              process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
          },
        }
      : {}),
  },
};
