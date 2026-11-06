import { websiteStatusLabel } from "@/lib/ui";
import type { WebsiteStatus } from "@/lib/types";

const styles: Record<string, { bg: string; fg: string }> = {
  NO_WEBSITE: { bg: "var(--accent-soft)", fg: "var(--accent)" },
  SOCIAL_ONLY: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  BROKEN_WEBSITE: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  WEAK_WEBSITE: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  WEBSITE_UNCERTAIN: { bg: "rgba(107,102,86,0.1)", fg: "var(--fg-muted)" },
  WEBSITE_EXISTS: { bg: "rgba(107,102,86,0.08)", fg: "var(--fg-faint)" },
  UNCHECKED: { bg: "rgba(107,102,86,0.08)", fg: "var(--fg-faint)" },
};

export function StatusPill({ status }: { status: WebsiteStatus }) {
  const style = styles[status] ?? styles.UNCHECKED;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wide font-medium whitespace-nowrap"
      style={{ background: style.bg, color: style.fg }}
    >
      {websiteStatusLabel[status] ?? status}
    </span>
  );
}
