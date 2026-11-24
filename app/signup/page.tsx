import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/signup");

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
