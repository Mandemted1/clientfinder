import Link from "next/link";
import { listRuns, getActiveRun } from "@/lib/queries";
import { startRun } from "@/lib/run-actions";
import type { RunStatus } from "@/lib/types";

const statusStyle: Record<RunStatus, { bg: string; fg: string }> = {
  proposed: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  queued: { bg: "rgba(107,102,86,0.1)", fg: "var(--fg-muted)" },
  running: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  succeeded: { bg: "var(--accent-soft)", fg: "var(--accent)" },
  failed: { bg: "rgba(107,102,86,0.1)", fg: "var(--fg-faint)" },
};

export default async function RunsPage() {
  const [runs, active] = await Promise.all([listRuns(20), getActiveRun()]);

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-6 md:px-10 py-14">
      <Link href="/" className="text-sm text-fg-faint hover:text-fg-muted">
        ← All prospects
      </Link>

      <header className="mt-8 mb-12">
        <p className="text-xs tracking-[0.2em] uppercase text-fg-faint mb-4">
          Client acquisition engine
        </p>
        <h1 className="font-serif italic text-5xl leading-none">New search</h1>
      </header>

      {active ? (
        <div className="mb-12 p-5 rounded-lg" style={{ background: "var(--amber-soft)" }}>
          <p className="text-sm" style={{ color: "var(--amber)" }}>
            A search is already running (#{active.id}, stage: {active.stage ?? "starting"}).
            Wait for it to finish before starting another.
          </p>
          <Link href={`/runs/${active.id}`} className="text-sm underline mt-2 inline-block" style={{ color: "var(--amber)" }}>
            Watch its progress →
          </Link>
        </div>
      ) : (
        <form action={startRun} className="space-y-6 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Niche" name="niche" placeholder="fashion boutiques" defaultValue="fashion_boutique" />
            <Field label="Location" name="location" placeholder="USA" defaultValue="USA" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-fg-faint block mb-2">
              Hashtags (comma-separated)
            </label>
            <textarea
              name="hashtags"
              rows={3}
              placeholder="onlineboutique, shopsmallbusiness, boutiqueowner"
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:border-accent outline-none transition-colors placeholder:text-fg-faint"
            />
            <p className="text-xs text-fg-faint mt-2">
              These are what actually get searched on Instagram -- niche and location are just
              labels stored on the results. Leave blank to reuse whatever hashtags the last run
              for this niche used.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Posts per hashtag"
              name="posts_per_hashtag"
              type="number"
              defaultValue="25"
            />
            <Field label="Max profiles to enrich" name="max_enrich" type="number" defaultValue="80" />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            Start search
          </button>
        </form>
      )}

      <section>
        <p className="text-xs uppercase tracking-wide text-fg-faint mb-4">Past runs</p>
        {runs.length === 0 ? (
          <p className="text-sm text-fg-muted">No runs yet.</p>
        ) : (
          <div>
            {runs.map((run) => {
              const style = statusStyle[run.status];
              return (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="flex items-center justify-between gap-4 py-4 hairline hover:bg-bg-hover -mx-3 px-3 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm">
                      {run.niche || "unnamed niche"} <span className="text-fg-faint">/</span>{" "}
                      {run.location || "unspecified location"}
                    </div>
                    <div className="text-xs text-fg-faint mt-0.5 font-mono">
                      {run.stats
                        ? `${run.stats.prospects} prospects, ${run.stats.discovered} discovered`
                        : run.stage
                          ? `stage: ${run.stage}`
                          : "queued"}
                    </div>
                  </div>
                  <span
                    className="shrink-0 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wide font-medium"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    {run.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-fg-faint block mb-2">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:border-accent outline-none transition-colors placeholder:text-fg-faint"
      />
    </div>
  );
}
