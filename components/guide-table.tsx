import type { Table } from "@/lib/data-guide";

// A small read-only table for the guide's examples.
export function GuideTable({
  table,
  tone,
}: {
  table: Table;
  tone: "good" | "bad";
}) {
  const head =
    tone === "good"
      ? "bg-[color:var(--c-bg-eaf0ff)]"
      : "bg-[color:var(--c-bg-fff6f4)]";
  return (
    <div className="overflow-x-auto rounded-md border border-[color:var(--c-border-e3e6f0)]">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className={head}>
            {table.headers.map((h, i) => (
              <th
                key={i}
                className="whitespace-nowrap border-b border-[color:var(--c-border-e3e6f0)] px-3 py-1.5 font-bold"
              >
                {h || (
                  <span className="font-normal text-[color:var(--c-text-9aa1b8)]">
                    (빈 칸)
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, ri) => (
            <tr
              key={ri}
              className="border-t border-[color:var(--c-border-edf0f5)]"
            >
              {table.headers.map((_, ci) => (
                <td key={ci} className="whitespace-nowrap px-3 py-1.5">
                  {r[ci] === "" || r[ci] === undefined ? (
                    <span className="text-[color:var(--c-text-9aa1b8)]">
                      (빈 칸)
                    </span>
                  ) : (
                    r[ci]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
