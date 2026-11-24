import Script from "next/script";

// Google Analytics 4. Off until NEXT_PUBLIC_GA_ID (like G-XXXXXXXXXX) is set, so nothing third-party
// loads by default. Loaded after the page is interactive so it never delays the first paint.
// Before turning it on, add Google Analytics to the 개인정보처리방침 (app/privacy/page.tsx); see docs/SEO.md.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function Analytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
