"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPANY } from "@/lib/company";

const link =
  "text-[color:var(--c-text-4a5272)] hover:text-[color:var(--c-text-0c1b4c)]";

export function SiteFooter() {
  const pathname = usePathname();
  // The editor and loading screens are exactly one screen tall on desktop, so no footer there.
  if (pathname.startsWith("/auth/")) return null;
  const fullScreen =
    pathname === "/studio/editor" || pathname === "/studio/loading";

  const rows = [
    ["대표", COMPANY.ceo],
    ["사업자등록번호", COMPANY.businessNumber],
    ["통신판매업 신고번호", COMPANY.mailOrderNumber],
    ["주소", COMPANY.address],
    ["이메일", COMPANY.email],
    ["전화", COMPANY.phone],
  ].filter(([, value]) => value);

  return (
    <footer
      className={`border-t border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-fafafc)] ${fullScreen ? "lg:hidden" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-8 py-10 text-[12px] leading-[1.8] text-[color:var(--c-text-7b8497)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-[14px] font-bold text-[color:var(--c-text-0c1b4c)]">
            {COMPANY.name}
          </div>
          <nav
            aria-label="약관 및 정책"
            className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] font-medium"
          >
            <Link href="/terms" className={link}>
              이용약관
            </Link>
            <Link href="/privacy" className={`${link} font-bold`}>
              개인정보처리방침
            </Link>
            <Link href="/guide" className={link}>
              데이터 형식 안내
            </Link>
          </nav>
        </div>

        {rows.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-0.5">
            {rows.map(([label, value]) => (
              <div key={label} className="flex gap-1.5">
                <dt>{label}</dt>
                <dd className="text-[color:var(--c-text-4a5272)]">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-4 text-[11px] text-[color:var(--c-text-99a1b1)]">
          © {COMPANY.name}. All rights reserved. · 이 서비스의 글꼴은 S-Core
          Dream입니다.
        </p>
      </div>
    </footer>
  );
}
