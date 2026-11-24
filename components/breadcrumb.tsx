import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

// "홈 > 현재 페이지" for people, plus the same trail as BreadcrumbList data for search engines.
// `trail` is the pages between the home page and the current one, ending with the current page.
export type Crumb = { name: string; path: string };

export function Breadcrumb({
  trail,
  visible = true,
}: {
  trail: Crumb[];
  // false: only the search-engine data, for pages whose layout has no room for a trail
  visible?: boolean;
}) {
  const all: Crumb[] = [{ name: "홈", path: "/" }, ...trail];
  return (
    <>
      {visible && (
        <nav aria-label="현재 위치" className="mb-5 text-[12px]">
          <ol className="flex flex-wrap items-center gap-1.5 text-[color:var(--c-text-7b8497)]">
            {all.map((c, i) => {
              const last = i === all.length - 1;
              return (
                <li key={c.path} className="flex items-center gap-1.5">
                  {last ? (
                    <span
                      aria-current="page"
                      className="font-medium text-[color:var(--c-text-4a5272)]"
                    >
                      {c.name}
                    </span>
                  ) : (
                    <Link href={c.path} className="hover:underline">
                      {c.name}
                    </Link>
                  )}
                  {!last && <span aria-hidden>›</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: i === 0 ? SITE_NAME : c.name,
            item: `${SITE_URL}${c.path === "/" ? "" : c.path}`,
          })),
        }}
      />
    </>
  );
}
