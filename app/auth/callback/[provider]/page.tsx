import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SocialCallback } from "@/components/social-callback";
import { PROVIDERS, isProvider } from "@/lib/social-auth";

export const metadata: Metadata = {
  title: "로그인 중 — MAC Studio",
  robots: { index: false },
};

export function generateStaticParams() {
  return PROVIDERS.map((p) => ({ provider: p.id }));
}

export default async function CallbackPage({
  params,
}: PageProps<"/auth/callback/[provider]">) {
  const { provider } = await params;
  if (!isProvider(provider)) notFound();
  return <SocialCallback provider={provider} />;
}
