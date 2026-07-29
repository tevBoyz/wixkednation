type AdminComingSoonProps = {
  title: string;
  stage: number;
};

export function AdminComingSoon({ title, stage }: AdminComingSoonProps) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Coming in Stage {stage}.
      </p>
    </div>
  );
}
