import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

// /manifest.webmanifest: how the site is named and colored when saved to a phone's home screen.
// To be installable as an app, browsers also want 192x192 and 512x512 icons; only the two sizes
// below exist so far (see docs/SEO.md, "Not done yet").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAFC",
    theme_color: "#2F66F5",
    icons: [
      { src: "/icon.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
