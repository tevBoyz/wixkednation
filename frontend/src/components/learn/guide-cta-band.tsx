import { GuideActions } from "@/components/learn/guide-actions";
import type { GuideCta } from "@/components/learn/guide-link";

export function GuideCtaBand({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body: string;
  primary: GuideCta;
  secondary?: GuideCta;
}) {
  return (
    <section className="mt-14 max-w-3xl rounded-lg border border-border bg-card/50 p-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <GuideActions className="mt-4" primary={primary} secondary={secondary} />
    </section>
  );
}
