import Link from "next/link";

type SectionHeadingProps = {
  id: string;
  title: string;
  lede?: string;
  href?: string;
  action?: string;
};

export function SectionHeading({
  id,
  title,
  lede,
  href,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
      <div className="min-w-0">
        <h2 id={id} className="text-2xl tracking-tight sm:text-3xl">
          {title}
        </h2>
        {lede ? (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{lede}</p>
        ) : null}
      </div>
      {href && action ? (
        <Link href={href} className="text-sm text-foreground underline underline-offset-4 transition-colors hover:text-primary">
          {action}
        </Link>
      ) : null}
    </div>
  );
}
