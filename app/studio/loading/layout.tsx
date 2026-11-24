import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page itself is a client component and cannot export metadata, so this layout does (noindex,
// see SITE_PAGES in lib/seo.ts).
export const metadata: Metadata = pageMetadata("/studio/loading");

export default function Layout({ children }: LayoutProps<"/studio/loading">) {
  return children;
}
