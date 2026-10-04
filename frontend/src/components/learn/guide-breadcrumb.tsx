import Link from "next/link";

export function GuideBreadcrumb({ title }: { title?: string }) {
  return (
    <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-foreground">
        Home
      </Link>
      <span aria-hidden> / </span>
      {title ? (
        <>
          <Link href="/learn" className="hover:text-foreground">
            Guides
          </Link>
          <span aria-hidden> / </span>
          <span className="text-foreground">{title}</span>
        </>
      ) : (
        <span className="text-foreground">Guides</span>
      )}
    </nav>
  );
}
