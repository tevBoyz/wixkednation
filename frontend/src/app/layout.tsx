import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteAtmosphere } from "@/components/brand/site-atmosphere";
import { AppProviders } from "@/components/providers/app-providers";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildLocalBusinessJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/json-ld";
import { buildDefaultMetadata } from "@/lib/seo/site-metadata";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = buildDefaultMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="relative flex min-h-dvh flex-col bg-background font-sans"
        suppressHydrationWarning
      >
        <JsonLd data={buildOrganizationJsonLd()} />
        <JsonLd data={buildWebSiteJsonLd()} />
        <JsonLd data={buildLocalBusinessJsonLd()} />
        <AppProviders>
          <SiteAtmosphere />
          <div className="relative z-10 flex min-h-dvh min-w-0 flex-1 flex-col">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
