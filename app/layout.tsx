import type { Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@/components/analytics";
import { AppToaster } from "@/components/app-toaster";
import { AuthModalProvider } from "@/components/auth-modal";
import { SessionRestore } from "@/components/session-restore";
import { SiteFooter } from "@/components/site-footer";
import { StorageCleanup } from "@/components/storage-cleanup";
import { SiteHeader } from "@/components/site-header";
import { LAYOUT_METADATA } from "@/lib/seo";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

// S-Core Dream (에스코어 드림), used unmodified as its license requires.
// 3 = Light, 4 = Regular, 5 = Medium, 6 = Bold.
const scDream = localFont({
  variable: "--font-sc-dream",
  display: "swap",
  src: [
    { path: "./fonts/SCDream3.otf", weight: "300", style: "normal" },
    { path: "./fonts/SCDream4.otf", weight: "400", style: "normal" },
    { path: "./fonts/SCDream5.otf", weight: "500", style: "normal" },
    { path: "./fonts/SCDream6.otf", weight: "700", style: "normal" },
  ],
});

// Title, description, Open Graph and the rest of the search settings live in lib/seo.ts.
export const metadata = LAYOUT_METADATA;

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1020" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme class is set by the inline script before first paint, so the server and client
    // markup differ on <html> by design.
    <html
      lang="ko"
      className={`${scDream.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <AuthModalProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </AuthModalProvider>
        <AppToaster />
        <StorageCleanup />
        <SessionRestore />
        <Analytics />
      </body>
    </html>
  );
}
