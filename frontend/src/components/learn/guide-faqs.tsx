import { GuideLink } from "@/components/learn/guide-link";
import type { FaqItem } from "@/content/faqs";

export function GuideFaqs({ faqs }: { faqs: readonly FaqItem[] }) {
  return (
    <>
      <dl className="mt-6 space-y-6">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt className="font-medium">{faq.question}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm text-muted-foreground">
        More answers in the{" "}
        <GuideLink href="/faqs">full delivery FAQ</GuideLink>.
      </p>
    </>
  );
}
