import type { ReactNode } from "react";

export type GuideStep = {
  title: string;
  body: ReactNode;
};

export function GuideSteps({ steps }: { steps: readonly GuideStep[] }) {
  return (
    <ol className="mt-6 space-y-6">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4">
          <span
            aria-hidden
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="font-medium">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
