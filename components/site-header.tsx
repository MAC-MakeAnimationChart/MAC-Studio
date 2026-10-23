"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuthModal } from "@/components/auth-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout, useUser } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";

const navLink = (active: boolean) =>
  `text-[14px] transition ${active ? "font-medium text-[color:var(--c-text-0c1b4c)]" : "text-[color:var(--c-text-4a5272)] hover:text-[color:var(--c-text-0c1b4c)]"}`;

const NAV = [
  { href: "/", label: "홈" },
  { href: "/studio", label: "스튜디오" },
  { href: "/#charts", label: "차트 목록" },
  { href: "/guide", label: "데이터 형식" },
];

export function SiteHeader() {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { unsaved } = useWorkspace();
  const openAuth = useAuthModal();
  // The phone menu is open only for the page it was opened on, so moving to another page closes it.
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuOpen = menuFor === pathname;
  const closeMenu = () => setMenuFor(null);
  // Inside the studio the user may have unfinished work, so sign-in opens over the page instead of leaving it.
  const inStudio = pathname.startsWith("/studio");

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : href === "/studio"
        ? pathname.startsWith("/studio")
        : href === "/guide"
          ? pathname === "/guide"
          : false;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuFor(null);
    };
    // phones in landscape / resized windows get the desktop nav, so the menu has nothing to show
    const wide = window.matchMedia("(min-width: 640px)");
    const onWide = () => wide.matches && setMenuFor(null);
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [menuOpen]);

  const signIn = (mode: "login" | "signup") => {
    closeMenu();
    openAuth(mode);
  };

  const signOut = () => {
    if (
      unsaved &&
      !window.confirm(
        "저장하지 않은 변경 사항이 있어요. 저장하지 않고 로그아웃할까요?",
      )
    )
      return;
    closeMenu();
    logout();
    router.push("/");
  };

  const ghost =
    "px-3 py-2 text-[14px] text-[color:var(--c-text-4a5272)] hover:text-[color:var(--c-text-0c1b4c)]";
  const solid =
    "rounded-lg bg-[color:var(--c-bg-2f66f5)] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[color:var(--c-bg-2757d6)]";
  const outline =
    "rounded-lg border border-[color:var(--c-border-b9bfd3)] px-4 py-2 text-[14px] font-medium text-[color:var(--c-text-0c1b4c)] hover:bg-[color:var(--c-bg-fafafc)]";

  return (
    <>
      {pathname === "/" && (
        <div className="bg-[color:var(--c-bg-2f66f5)] px-4 py-2.5 text-center text-[13px] text-white">
          MAC Studio는 무료예요 · 회원가입 없이 바로 시작할 수 있어요
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)]">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-8">
            <button
              type="button"
              onClick={() => setMenuFor(menuOpen ? null : pathname)}
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="-ml-2 rounded-lg p-2 text-[color:var(--c-text-0c1b4c)] hover:bg-[color:var(--c-bg-f5f6fa)] sm:hidden"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
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
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={navLink(isActive(n.href))}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* on phones the sign-in / my page actions live in the ≡ menu */}
            <div className="hidden items-center gap-2 sm:flex">
              {user ? (
                <>
                  <Link
                    href="/mypage"
                    className={`px-3 py-2 text-[14px] ${pathname === "/mypage" ? "font-medium text-[color:var(--c-text-0c1b4c)]" : "text-[color:var(--c-text-4a5272)] hover:text-[color:var(--c-text-0c1b4c)]"}`}
                  >
                    마이페이지
                  </Link>
                  <button onClick={signOut} className={outline}>
                    로그아웃
                  </button>
                </>
              ) : inStudio ? (
                <>
                  <button onClick={() => signIn("login")} className={ghost}>
                    로그인
                  </button>
                  <button onClick={() => signIn("signup")} className={solid}>
                    회원가입
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={ghost}>
                    로그인
                  </Link>
                  <Link href="/signup" className={solid}>
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="모바일 메뉴"
            className="absolute inset-x-0 top-full flex max-h-[calc(100dvh-69px)] flex-col gap-1 overflow-y-auto border-b border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)] px-4 pb-5 pt-3 shadow-[0_16px_40px_rgba(12,27,76,0.18)] sm:hidden"
          >
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={closeMenu}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-3 text-[16px] ${isActive(n.href) ? "bg-[color:var(--c-bg-eaf0ff)] font-bold text-[color:var(--c-text-0c1b4c)]" : "text-[color:var(--c-text-4a5272)] hover:bg-[color:var(--c-bg-f5f6fa)]"}`}
              >
                {n.label}
              </Link>
            ))}
            <div className="my-2 border-t border-[color:var(--c-border-edf0f5)]" />
            {user ? (
              <>
                <Link
                  href="/mypage"
                  onClick={closeMenu}
                  aria-current={pathname === "/mypage" ? "page" : undefined}
                  className={`rounded-lg px-3 py-3 text-[16px] ${pathname === "/mypage" ? "bg-[color:var(--c-bg-eaf0ff)] font-bold text-[color:var(--c-text-0c1b4c)]" : "text-[color:var(--c-text-4a5272)] hover:bg-[color:var(--c-bg-f5f6fa)]"}`}
                >
                  마이페이지
                </Link>
                <button
                  onClick={signOut}
                  className="rounded-lg px-3 py-3 text-left text-[16px] text-[color:var(--c-text-4a5272)] hover:bg-[color:var(--c-bg-f5f6fa)]"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {inStudio ? (
                  <>
                    <button
                      onClick={() => signIn("login")}
                      className={`${outline} py-3 text-[15px]`}
                    >
                      로그인
                    </button>
                    <button
                      onClick={() => signIn("signup")}
                      className={`${solid} py-3 text-[15px]`}
                    >
                      회원가입
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className={`${outline} py-3 text-center text-[15px]`}
                    >
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      onClick={closeMenu}
                      className={`${solid} py-3 text-center text-[15px]`}
                    >
                      회원가입
                    </Link>
                  </>
                )}
              </div>
            )}
          </nav>
        )}
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="메뉴 닫기"
          tabIndex={-1}
          onClick={closeMenu}
          className="fixed inset-0 z-10 bg-[#0C1B4C]/40 sm:hidden"
        />
      )}
    </>
  );
}
