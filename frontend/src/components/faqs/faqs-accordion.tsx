"use client";

import { ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";

import { FAQ_ITEMS } from "@/content/faqs";
import { cn } from "@/lib/utils";

export function FaqsAccordion() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-background/85 shadow-sm backdrop-blur-sm">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <li key={item.question}>
            <h2>
              <button
                id={buttonId}
                type="button"
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left text-base font-medium tracking-tight transition-colors hover:bg-muted/40 sm:px-5 sm:py-5 sm:text-lg"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() =>
                  setOpenIndex((current) => (current === index ? null : index))
                }
              >
                <span>{item.question}</span>
                <ChevronDownIcon
                  className={cn(
                    "mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            </h2>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
              className={cn(
                "faq-accordion-panel grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    "space-y-3 px-4 pb-5 text-sm leading-relaxed text-muted-foreground transition-opacity duration-300 ease-out motion-reduce:transition-none sm:px-5 sm:text-base",
                    isOpen ? "opacity-100" : "opacity-0",
                  )}
                >
                  {item.answer.split("\n\n").map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
