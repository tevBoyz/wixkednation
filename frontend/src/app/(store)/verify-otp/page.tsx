import { VerifyOtpPageClient } from "@/components/auth/verify-otp-form";
import { Container } from "@/components/layout/container";

export default function VerifyOtpPage() {
  return (
    <Container
      as="main"
      className="flex flex-1 flex-col items-center justify-center py-16"
    >
      <VerifyOtpPageClient />
    </Container>
  );
}
