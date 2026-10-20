"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout, useUser } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";

const navLink = (active: boolean) =>
  `text-[14px] transition ${active ? "font-medium text-[color:var(--c-text-0c1b4c)]" : "text-[color:var(--c-text-4a5272)] hover:text-[color:var(--c-text-0c1b4c)]"}`;

export function SiteHeader() {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { unsaved } = useWorkspace();
  const openAuth = useAuthModal();
  // Inside the studio the user may have unfinished work, so sign-in opens over the page instead of leaving it.
  const inStudio = pathname.startsWith("/studio");

  return (
    <>
      {pathname === "/" && (
        <div className="bg-[color:var(--c-bg-2f66f5)] px-4 py-2.5 text-center text-[13px] text-white">
          MAC Studio는 무료예요 · 회원가입 없이 바로 시작할 수 있어요
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)]">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between gap-4 px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo-mark.png"
                alt=""
                width={30}
                height={28}
                priority
              />
              <span className="text-[18px] font-bold tracking-[-0.02em]">
                MAC <span className="font-light">Studio</span>
              </span>
            </Link>
            <nav
              className="hidden items-center gap-6 sm:flex"
              aria-label="주요 메뉴"
            >
              <Link href="/" className={navLink(pathname === "/")}>
                홈
              </Link>
              <Link
                href="/studio"
                className={navLink(pathname.startsWith("/studio"))}
              >
                스튜디오
              </Link>
              <Link href="/#charts" className={navLink(false)}>
                차트 목록
              </Link>
              <Link href="/guide" className={navLink(pathname === "/guide")}>
                데이터 형식
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  href="/mypage"
                  className={`px-3 py-2 text-[14px] ${pathname === "/mypage" ? "font-medium text-[color:var(--c-text-0c1b4c)]" : "text-[color:var(--c-text-4a5272)] hover:text-[color:var(--c-text-0c1b4c)]"}`}
                >
                  마이페이지
                </Link>
                <button
                  onClick={() => {
                    if (
                      unsaved &&
                      !window.confirm(
                        "저장하지 않은 변경 사항이 있어요. 저장하지 않고 로그아웃할까요?",
                      )
                    )
                      return;
                    logout();
                    router.push("/");
                  }}
                  className="rounded-lg border border-[color:var(--c-border-b9bfd3)] px-4 py-2 text-[14px] font-medium text-[color:var(--c-text-0c1b4c)] hover:bg-[color:var(--c-bg-fafafc)]"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                {inStudio ? (
                  <>
                    <button
                      onClick={() => openAuth("login")}
                      className="px-3 py-2 text-[14px] text-[color:var(--c-text-4a5272)] hover:text-[color:var(--c-text-0c1b4c)]"
                    >
                      로그인
                    </button>
                    <button
                      onClick={() => openAuth("signup")}
                      className="rounded-lg bg-[color:var(--c-bg-2f66f5)] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[color:var(--c-bg-2757d6)]"
                    >
                      회원가입
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-3 py-2 text-[14px] text-[color:var(--c-text-4a5272)] hover:text-[color:var(--c-text-0c1b4c)]"
                    >
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-lg bg-[color:var(--c-bg-2f66f5)] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[color:var(--c-bg-2757d6)]"
                    >
                      회원가입
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
