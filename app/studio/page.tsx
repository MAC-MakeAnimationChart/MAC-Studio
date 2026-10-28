import { StudioFlow } from "@/components/studio-flow";
import { renderPreviews } from "@/components/preview-nodes";

// A server component on purpose: the chart example pictures are drawn here, once, at build time,
// and handed to the (client) studio screen.
export default function StudioPage() {
  return <StudioFlow previews={renderPreviews()} />;
}
