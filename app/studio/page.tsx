import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { StudioFlow } from "@/components/studio-flow";
import { renderPreviews } from "@/components/preview-nodes";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/studio");

// A server component on purpose: the chart example pictures are drawn here, once, at build time,
// and handed to the (client) studio screen.
export default function StudioPage() {
  return (
    <>
      {/* search-engine data only; the screen has its own heading and steps */}
      <Breadcrumb
        visible={false}
        trail={[{ name: "스튜디오", path: "/studio" }]}
      />
      <StudioFlow previews={renderPreviews()} />
    </>
  );
}
