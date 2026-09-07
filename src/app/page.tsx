import Link from "next/link";
import { Suspense } from "react";
import { getStats, getLeads, type LeadView, type SortKey } from "@/lib/queries";
import { setLeadStatus } from "@/lib/actions";
import type { WebsiteStatus } from "@/lib/types";
import { ScoreMark } from "@/components/ScoreMark";
import { StatusPill } from "@/components/StatusPill";
import { LeadStatusDot } from "@/components/LeadStatusDot";
import { SearchBox } from "@/components/SearchBox";
import { formatFollowers } from "@/lib/ui";

type Params = { [key: string]: string | string[] | undefined };

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function hrefWith(current: Params, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (typeof v === "string") params.set(k, v);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

const VIEW_OPTIONS: { value: LeadView; label: string }[] = [
  { value: "prospects", label: "Prospects" },
  { value: "disqualified", label: "Disqualified" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All scored" },
];

const STATUS_OPTIONS: { value: WebsiteStatus | "all"; label: string }[] = [
  { value: "all", label: "Any status" },
  { value: "NO_WEBSITE", label: "No website" },
  { value: "SOCIAL_ONLY", label: "Social only" },
  { value: "BROKEN_WEBSITE", label: "Broken" },
  { value: "WEBSITE_UNCERTAIN", label: "Uncertain" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Score" },
  { value: "followers", label: "Followers" },
  { value: "recent", label: "Newest" },
];

export default async function Home({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const view = (one(params.view) as LeadView) ?? "prospects";
  const websiteStatus = (one(params.status) as WebsiteStatus | "all") ?? "all";
  const sort = (one(params.sort) as SortKey) ?? "score";
  const q = one(params.q);

  const [stats, leads] = await Promise.all([
    getStats(),
    getLeads({ view, websiteStatus, sort, q }),
  ]);

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-10 py-14">
      <header className="mb-14 flex items-start justify-between gap-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-fg-faint mb-4">
            Client acquisition engine
          </p>
          <h1 className="font-serif italic text-5xl md:text-6xl leading-none">Prospects</h1>
        </div>
        <div className="flex gap-2 shrink-0 mt-2">
          <Link
            href="/chat"
            className="px-4 py-2 rounded-full text-sm cursor-pointer"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            Chat
          </Link>
          <Link
            href="/runs"
            className="px-4 py-2 rounded-full text-sm border border-border text-fg-muted hover:border-fg-muted hover:text-fg transition-colors"
          >
            New search
          </Link>
        </div>
      </header>

      <StatsStrip stats={stats} />

      <div className="hairline my-10" />

      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={hrefWith(params, { view: opt.value === "prospects" ? undefined : opt.value })}
              className="px-3.5 py-1.5 text-sm rounded-full border transition-colors"
              style={
                view === opt.value
                  ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--on-accent)" }
                  : { borderColor: "var(--border)", color: "var(--fg-muted)" }
              }
            >
              {opt.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <Suspense fallback={null}>
            <SearchBox />
          </Suspense>

          <div className="flex items-center gap-1 text-sm">
            {SORT_OPTIONS.map((opt, i) => (
              <span key={opt.value} className="flex items-center">
                {i > 0 && <span className="text-fg-faint mx-1.5">/</span>}
                <Link
                  href={hrefWith(params, { sort: opt.value === "score" ? undefined : opt.value })}
                  className={sort === opt.value ? "text-fg" : "text-fg-faint hover:text-fg-muted"}
                >
                  {opt.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>

      {view !== "disqualified" && view !== "dismissed" && (
        <div className="flex flex-wrap gap-2 mb-8 -mt-2">
          {STATUS_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={hrefWith(params, { status: opt.value === "all" ? undefined : opt.value })}
              className="px-2.5 py-1 text-xs rounded-full border transition-colors"
              style={
                websiteStatus === opt.value
                  ? { borderColor: "var(--fg-muted)", color: "var(--fg)" }
                  : { borderColor: "var(--border-soft)", color: "var(--fg-faint)" }
              }
            >
              {opt.label}
            </Link>
          ))}
        </div>
      )}

      <LeadList leads={leads} dismissedView={view === "dismissed"} />

      {stats.pending > 0 && (
        <p className="text-xs text-fg-faint mt-10">
          {stats.pending} more discovered and waiting on enrichment or website verification.
        </p>
      )}
    </div>
  );
}

function StatsStrip({ stats }: { stats: Awaited<ReturnType<typeof getStats>> }) {
  const items: { label: string; value: number }[] = [
    { label: "Discovered", value: stats.total },
    { label: "Enriched", value: stats.enriched },
    { label: "Verified", value: stats.verified },
    { label: "Prospects", value: stats.prospects },
    { label: "Disqualified", value: stats.disqualified },
    { label: "Dismissed", value: stats.dismissed },
  ];
  return (
    <div className="flex flex-wrap gap-x-12 gap-y-6">
      {items.map((item) => (
        <div key={item.label}>
          <div className="font-serif text-4xl tabular">{item.value}</div>
          <div className="text-xs uppercase tracking-wide text-fg-faint mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function LeadList({
  leads,
  dismissedView,
}: {
  leads: Awaited<ReturnType<typeof getLeads>>;
  dismissedView: boolean;
}) {
  if (leads.length === 0) {
    return <p className="text-fg-muted text-sm py-16 text-center">No matches for this filter.</p>;
  }

  return (
    <div>
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="flex items-center gap-3 py-4 hairline hover:bg-bg-hover -mx-3 px-3 rounded-lg transition-colors"
        >
          <Link href={`/leads/${lead.id}`} className="flex items-center gap-5 flex-1 min-w-0">
            <ScoreMark score={lead.score} />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm text-accent">@{lead.ig_username}</span>
                <LeadStatusDot status={lead.status} />
                <span className="truncate text-sm text-fg-muted">{lead.canonical_name}</span>
              </div>
              <p className="text-sm text-fg-faint truncate mt-0.5 max-w-xl">
                {lead.ai_pitch || lead.bio || "No bio captured."}
              </p>
            </div>

            <div className="hidden sm:block text-right shrink-0">
              <div className="font-mono text-sm tabular">{formatFollowers(lead.followers)}</div>
              <div className="text-[11px] text-fg-faint">followers</div>
            </div>

            <div className="shrink-0">
              <StatusPill status={lead.website_status} />
            </div>
          </Link>

          <form action={setLeadStatus.bind(null, lead.id, dismissedView ? "new" : "rejected")}>
            <button
              type="submit"
              title={dismissedView ? "Restore to prospects" : "Not a fit — dismiss"}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-border-soft text-fg-faint hover:text-fg hover:border-fg-muted transition-colors cursor-pointer"
            >
              {dismissedView ? "↺" : "×"}
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
