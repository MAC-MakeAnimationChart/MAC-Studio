import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "이용약관 — MAC Studio" };

export default function TermsPage() {
  return (
    <LegalPage title="이용약관">
      <p>
        이용약관은 서비스 정식 공개 전에 확정해 이곳에 게시할 예정이에요. 지금은
        약관 내용이 확정되지 않은 임시 안내 페이지예요.
      </p>
    </LegalPage>
  );
}
