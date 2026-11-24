import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

// The picture shown when a link to the site is shared (KakaoTalk, Slack, X, search previews): 1200x630.
// It is drawn once at build time. Text uses the site's own font, S-Core Dream, read from app/fonts.
export const alt = "MAC Studio – 데이터를 올리면, 차트가 완성돼요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read once, at module scope (not inside the function): reading a file inside it counts as uncached
// data, which makes Next.js draw the picture for every request instead of once at build time.
const light = await readFile(join(process.cwd(), "app/fonts/SCDream3.otf"));
const bold = await readFile(join(process.cwd(), "app/fonts/SCDream6.otf"));
const logo = await readFile(
  join(process.cwd(), "public/logo-mark.png"),
  "base64",
);
const logoSrc = `data:image/png;base64,${logo}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 90px",
        background:
          "linear-gradient(135deg, #0C1B4C 0%, #2F66F5 58%, #4ED3FD 100%)",
        color: "#FFFFFF",
        fontFamily: "SCDream",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: -1,
            opacity: 0.9,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
            fontSize: 84,
            fontWeight: 300,
            lineHeight: 1.2,
            letterSpacing: -3,
          }}
        >
          <span>데이터를 올리면,</span>
          <span>차트가 완성돼요.</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 30,
            fontWeight: 300,
            opacity: 0.85,
          }}
        >
          CSV·엑셀 → 막대·선·원형 차트 → JPG·PNG·TIFF
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
      <img src={logoSrc} width={260} height={245} alt="" />
    </div>,
    {
      ...size,
      fonts: [
        { name: "SCDream", data: light, weight: 300, style: "normal" },
        { name: "SCDream", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
