import Link from "next/link";
import type { ReactNode } from "react";

export type GuideCta = {
  label: string;
  href: string;
};

export function GuideLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
