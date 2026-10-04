import Link from "next/link";

export type GuideCard = {
  href: string;
  title: string;
  description: string;
};

export function GuideNextLinks({ links }: { links: readonly GuideCard[] }) {
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex h-full flex-col rounded-lg border border-border bg-card/50 p-4 transition-colors hover:border-primary/40"
          >
            <span className="font-medium">{item.title}</span>
            <span className="mt-1 text-sm text-muted-foreground">
              {item.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
