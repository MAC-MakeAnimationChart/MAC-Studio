// Checks what a search engine sees on a RUNNING copy of the site, and exits with an error if something
// is off. See docs/SEO.md.
//
//   npm run build && npm start        (in one terminal)
//   npm run seo:check                 (in another; defaults to http://localhost:3000)
//   npm run seo:check -- https://your-domain.example      (check the live site)
//
// Pages meant for search are read from /sitemap.xml. PRIVATE_PATHS below must match the pages with
// `index: false` in lib/seo.ts.

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const PRIVATE_PATHS = ["/login", "/signup", "/mypage", "/studio/editor", "/studio/loading"];
const TITLE_MAX = 60; // characters; Korean letters are wide, so real titles should stay well below
const DESC_MIN = 120;
const DESC_MAX = 155;

let failures = 0;
const fail = (where, message) => {
  failures += 1;
  console.log(`  FAIL ${where}: ${message}`);
};
const pass = (message) => console.log(`  ok   ${message}`);

const first = (re, text) => re.exec(text)?.[1] ?? null;

async function get(path) {
  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  return { status: res.status, text: await res.text(), type: res.headers.get("content-type") ?? "" };
}

function readHead(html) {
  return {
    title: first(/<title>([^<]*)<\/title>/, html) ?? "",
    description: first(/<meta name="description" content="([^"]*)"/, html) ?? "",
    canonical: first(/<link rel="canonical" href="([^"]*)"/, html),
    robots: first(/<meta name="robots" content="([^"]*)"/, html),
    ogImage: first(/<meta property="og:image" content="([^"]*)"/, html),
    ogLocale: first(/<meta property="og:locale" content="([^"]*)"/, html),
    twitterCard: first(/<meta name="twitter:card" content="([^"]*)"/, html),
    lang: first(/<html lang="([^"]*)"/, html),
    h1: (html.match(/<h1[ >]/g) ?? []).length,
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => m[1]),
  };
}

console.log(`Checking ${base}\n`);

// ---- robots.txt, sitemap.xml, manifest ----
console.log("robots.txt / sitemap.xml / manifest");
const robots = await get("/robots.txt");
if (robots.status !== 200) fail("/robots.txt", `status ${robots.status}`);
else {
  const hasSitemap = /^Sitemap: .+\/sitemap\.xml$/m.test(robots.text);
  const blocksAll = /^Disallow: \/$/m.test(robots.text);
  if (blocksAll) console.log("  note robots.txt blocks everything (a preview deployment); the page checks below will not mean much");
  else if (!hasSitemap) fail("/robots.txt", "no Sitemap line");
  else pass("robots.txt allows crawling and names the sitemap");
}

const sitemap = await get("/sitemap.xml");
const indexablePaths = [];
if (sitemap.status !== 200) fail("/sitemap.xml", `status ${sitemap.status}`);
else {
  for (const m of sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)) indexablePaths.push(new URL(m[1]).pathname);
  if (indexablePaths.length === 0) fail("/sitemap.xml", "no URLs");
  else pass(`sitemap lists ${indexablePaths.length} pages: ${indexablePaths.join(" ")}`);
  for (const p of PRIVATE_PATHS)
    if (indexablePaths.includes(p)) fail("/sitemap.xml", `${p} is private but is in the sitemap`);
}

const manifest = await get("/manifest.webmanifest");
if (manifest.status !== 200) fail("/manifest.webmanifest", `status ${manifest.status}`);
else pass("manifest is served");

// ---- pages meant for search ----
for (const path of indexablePaths) {
  console.log(`\n${path}  (indexed)`);
  const { status, text } = await get(path);
  if (status !== 200) {
    fail(path, `status ${status}`);
    continue;
  }
  const h = readHead(text);
  if (!h.title) fail(path, "no <title>");
  else if (h.title.length > TITLE_MAX) fail(path, `title is ${h.title.length} characters (max ${TITLE_MAX}): ${h.title}`);
  else pass(`title (${h.title.length}): ${h.title}`);
  if (h.description.length < DESC_MIN || h.description.length > DESC_MAX)
    fail(path, `description is ${h.description.length} characters (want ${DESC_MIN}-${DESC_MAX})`);
  else pass(`description (${h.description.length})`);
  if (!h.canonical) fail(path, "no canonical link");
  else if (new URL(h.canonical).pathname !== path) fail(path, `canonical points to ${h.canonical}`);
  else pass("canonical matches the page");
  if (h.robots && /noindex/.test(h.robots)) fail(path, `robots meta says "${h.robots}" but the page is in the sitemap`);
  if (!h.ogImage) fail(path, "no og:image");
  if (h.ogLocale !== "ko_KR") fail(path, `og:locale is ${h.ogLocale}`);
  if (h.twitterCard !== "summary_large_image") fail(path, `twitter:card is ${h.twitterCard}`);
  if (h.lang !== "ko") fail(path, `<html lang> is ${h.lang}`);
  if (h.h1 !== 1) fail(path, `${h.h1} <h1> elements (want exactly 1)`);
  else pass("one <h1>");
  for (const blob of h.jsonLd) {
    try {
      JSON.parse(blob);
    } catch {
      fail(path, "a JSON-LD block is not valid JSON");
    }
  }
  if (h.jsonLd.length > 0) pass(`${h.jsonLd.length} JSON-LD block(s) parse`);
}

// ---- pages that must stay out of search ----
for (const path of PRIVATE_PATHS) {
  console.log(`\n${path}  (private)`);
  const { status, text } = await get(path);
  if (status !== 200) {
    fail(path, `status ${status}`);
    continue;
  }
  const h = readHead(text);
  if (!h.robots || !/noindex/.test(h.robots)) fail(path, `robots meta is "${h.robots}", expected noindex`);
  else pass(`robots meta: ${h.robots}`);
}

// ---- a missing page ----
console.log("\n/this-page-does-not-exist  (404)");
const missing = await get("/this-page-does-not-exist");
if (missing.status !== 404) fail("404", `status ${missing.status}, expected 404`);
else pass("missing pages answer 404");

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
