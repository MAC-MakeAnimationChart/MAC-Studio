import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/login");

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
