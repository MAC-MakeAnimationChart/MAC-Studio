import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppToaster } from "@/components/app-toaster";
import { AuthModalProvider } from "@/components/auth-modal";
import { SiteHeader } from "@/components/site-header";
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

export const metadata: Metadata = {
  title: "MAC Studio — 데이터를 올리면, 차트가 완성돼요.",
  description: "비전공자를 위한 노코드 데이터 시각화 스튜디오",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

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
          <SiteHeader />
          {children}
        </AuthModalProvider>
        <AppToaster />
      </body>
    </html>
  );
}
