import type { MetadataRoute } from "next";
import { IS_INDEXABLE_DEPLOYMENT, SITE_URL } from "@/lib/seo";

// /robots.txt. Crawlers are kept out of the parts of the app that only make sense for a signed-in
// person or in the middle of a flow. Pages that should be crawled but not shown in search (/login,
// /signup) are NOT listed here: they carry "noindex" and a crawler has to be able to read that.
export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE_DEPLOYMENT) {
    // a Vercel preview deployment: nothing here should be found through search
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/mypage",
        "/studio/editor",
        "/studio/loading",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
