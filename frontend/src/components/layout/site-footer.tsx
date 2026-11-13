import { Container } from "@/components/layout/container";
import { SITE_NAME } from "@/config/brand";

/**
 * Fine print only. Site links live in the masthead menus and the Index.
 * Bottom padding clears the floating dock.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 pb-28 sm:pb-32">
      <Container className="flex flex-col gap-2 pt-5 sm:flex-row sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          © {new Date().getFullYear()} {SITE_NAME}. Same-day cannabis delivery
          across Ohio.
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          Adults 21+ only. Valid government ID required at the door.
        </p>
      </Container>
    </footer>
  );
}
