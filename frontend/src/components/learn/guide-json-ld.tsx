import { JsonLd } from "@/components/seo/json-ld";
import type { FaqItem } from "@/content/faqs";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildLocalBusinessJsonLd,
} from "@/lib/seo/json-ld";

export function GuideJsonLd({
  title,
  path,
  faqs,
}: {
  title: string;
  path: string;
  faqs?: readonly FaqItem[];
}) {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/learn" },
          { name: title, path },
        ])}
      />
      {faqs?.length ? <JsonLd data={buildFaqPageJsonLd([...faqs])} /> : null}
      <JsonLd data={buildLocalBusinessJsonLd()} />
    </>
  );
}
