"use client";

import { useTransition } from "react";
import { setLeadStatus } from "@/lib/actions";
import type { LeadStatus } from "@/lib/types";

const options: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "rejected", label: "Dismiss" },
];

export function LeadStatusActions({ id, current }: { id: number; current: LeadStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = current === opt.value || (current === "scored" && opt.value === "new");
        return (
          <button
            key={opt.value}
            disabled={isPending}
            onClick={() => startTransition(() => setLeadStatus(id, opt.value))}
            className="px-3 py-1.5 text-xs rounded-full border transition-colors disabled:opacity-40 cursor-pointer"
            style={
              active
                ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--on-accent)" }
                : { borderColor: "var(--border)", color: "var(--fg-muted)" }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
