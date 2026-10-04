export type GuideFact = {
  label: string;
  value: string;
};

export function GuideQuickFacts({ facts }: { facts: readonly GuideFact[] }) {
  return (
    <dl className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="rounded-lg border border-border bg-card/50 px-4 py-3"
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {fact.label}
          </dt>
          <dd className="mt-1 text-sm font-medium">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
