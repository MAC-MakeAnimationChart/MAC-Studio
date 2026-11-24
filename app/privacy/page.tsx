import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("/privacy");

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침" path="/privacy">
      <p>
        개인정보처리방침은 서비스 정식 공개 전에 확정해 이곳에 게시할
        예정이에요. 지금은 내용이 확정되지 않은 임시 안내 페이지예요.
      </p>
      <p>
        참고로 현재 데모 버전은 업로드한 파일을 서버로 보내지 않고 사용자
        브라우저 안에서만 처리하며, 저장한 내용도 이 브라우저에만 남아요.
      </p>
    </LegalPage>
  );
}
