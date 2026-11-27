import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/reset-password");

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
