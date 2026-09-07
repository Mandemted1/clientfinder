import type { LeadStatus } from "@/lib/types";

const colors: Record<LeadStatus, string> = {
  new: "var(--fg-faint)",
  scored: "var(--fg-faint)",
  shortlisted: "var(--accent)",
  contacted: "var(--amber)",
  rejected: "var(--fg-muted)",
};

export function LeadStatusDot({ status }: { status: LeadStatus }) {
  if (status === "new" || status === "scored") return null;
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ background: colors[status] }}
      title={status}
    />
  );
}
