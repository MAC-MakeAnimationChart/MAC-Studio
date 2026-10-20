import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "회원가입 — MAC Studio" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
