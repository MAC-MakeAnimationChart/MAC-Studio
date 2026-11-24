import type { MetadataRoute } from "next";
import { SITE_PAGES, SITE_URL } from "@/lib/seo";

// /sitemap.xml, built at build time from SITE_PAGES (lib/seo.ts): every page with index: true.
// To add a page to the sitemap, add it to SITE_PAGES; there is nothing to change here.
export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_PAGES.filter((p) => p.index).map((p) => ({
    url: `${SITE_URL}${p.path === "/" ? "" : p.path}`,
    lastModified: p.lastModified ? new Date(p.lastModified) : undefined,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
