import { GoogleCallbackClient } from "./google-callback-client";

export default function GoogleCallbackPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-background px-4 py-16">
      <GoogleCallbackClient />
    </main>
  );
}
