import type { Metadata } from "next";
import { WithdrawForm } from "@/components/withdraw-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/withdraw");

export default function WithdrawPage() {
  return <WithdrawForm />;
}
