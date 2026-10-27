import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MockProvider } from "@/components/mock-provider";
import { PROVIDERS, isProvider } from "@/lib/social-auth";

export const metadata: Metadata = {
  title: "소셜 로그인 (데모) — MAC Studio",
  robots: { index: false },
};

export function generateStaticParams() {
  return PROVIDERS.map((p) => ({ provider: p.id }));
}

export default async function MockProviderPage({
  params,
}: PageProps<"/auth/mock/[provider]">) {
  const { provider } = await params;
  if (!isProvider(provider)) notFound();
  return <MockProvider provider={provider} />;
}
