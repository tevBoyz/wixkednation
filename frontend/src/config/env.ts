function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export type PublicEnv = {
  apiUrl: string;
  appUrl: string;
};

export function getPublicEnv(): PublicEnv {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiUrl?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_URL. Copy .env.example to .env.local and set NEXT_PUBLIC_API_URL=http://localhost:5000",
    );
  }

  if (!appUrl?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_APP_URL. Copy .env.example to .env.local and set NEXT_PUBLIC_APP_URL=http://localhost:3000",
    );
  }

  return {
    apiUrl: trimTrailingSlash(apiUrl.trim()),
    appUrl: trimTrailingSlash(appUrl.trim()),
  };
}
