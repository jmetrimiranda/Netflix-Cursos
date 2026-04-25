"use client";

import { Accordion } from "radix-ui";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/content/faq";
import { cn } from "@/lib/utils";

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion.Root
      type="single"
      collapsible
      className="divide-y divide-border rounded-lg border border-border bg-card"
    >
      {items.map((item, i) => (
        <Accordion.Item key={`faq-${i}`} value={`faq-${i}`}>
          <Accordion.Header>
            <Accordion.Trigger
              className={cn(
                "group flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium text-foreground transition-colors",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span>{item.question}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content
            className={cn(
              "overflow-hidden text-sm leading-relaxed text-muted-foreground",
              "data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
            )}
          >
            <p className="px-5 pb-5">{item.answer}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
