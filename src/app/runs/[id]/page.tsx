import Link from "next/link";
import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { getRun } from "@/lib/queries";
import { RunStatusPoller } from "@/components/RunStatusPoller";

const STAGES = ["discover", "enrich", "verify", "score", "reason"];
const PROJECT_DIR = "/Users/Ted/client finder ";

function readLogTail(runId: number, lines = 60): string | null {
  const logPath = path.join(PROJECT_DIR, "exports", "run_logs", `run_${runId}.log`);
  try {
    const content = fs.readFileSync(logPath, "utf-8");
    const allLines = content.split("\n");
    return allLines.slice(-lines).join("\n").trim();
  } catch {
    return null;
  }
}

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const runId = Number(id);
  if (!Number.isFinite(runId)) notFound();

  const run = await getRun(runId);
  if (!run) notFound();

  const active = run.status === "queued" || run.status === "running";
  const log = readLogTail(runId);
  const currentStageIndex = STAGES.indexOf(run.stage ?? "");

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-6 md:px-10 py-14">
      <RunStatusPoller active={active} />

      <Link href="/runs" className="text-sm text-fg-faint hover:text-fg-muted">
        ← New search
      </Link>

      <header className="mt-8 mb-10">
        <p className="text-xs tracking-[0.2em] uppercase text-fg-faint mb-4">
          Run #{run.id}
        </p>
        <h1 className="font-serif italic text-4xl leading-tight">
          {run.niche || "unnamed niche"} <span className="text-fg-faint not-italic">/</span>{" "}
          {run.location || "unspecified"}
        </h1>
      </header>

      <div className="flex items-center gap-3 mb-10">
        <StatusBadge status={run.status} />
        {active && <span className="text-sm text-fg-faint">updating live...</span>}
      </div>

      {active && (
        <div className="flex gap-2 mb-10">
          {STAGES.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className="h-1.5 rounded-full mb-2"
                style={{
                  background: i <= currentStageIndex ? "var(--accent)" : "var(--border)",
                }}
              />
              <p className="text-[11px] uppercase tracking-wide text-fg-faint">{s}</p>
            </div>
          ))}
        </div>
      )}

      {run.status === "failed" && run.error && (
        <div className="mb-10 p-5 rounded-lg" style={{ background: "rgba(107,102,86,0.1)" }}>
          <p className="text-xs uppercase tracking-wide text-fg-faint mb-2">Error</p>
          <p className="text-sm text-fg-muted font-mono whitespace-pre-wrap">{run.error}</p>
        </div>
      )}

      {run.stats && (
        <div className="flex flex-wrap gap-x-10 gap-y-6 mb-10 py-6 hairline">
          <Stat label="Discovered" value={run.stats.discovered} />
          <Stat label="Enriched" value={run.stats.enriched} />
          <Stat label="Verified" value={run.stats.verified} />
          <Stat label="Prospects" value={run.stats.prospects} />
        </div>
      )}

      {run.status === "succeeded" && (
        <Link
          href="/"
          className="inline-block mb-10 px-4 py-2 rounded-full text-sm"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          View prospects →
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 mb-10 text-sm">
        <Meta label="Hashtags" value={run.hashtags || "(reused previous)"} />
        <Meta label="Posts per hashtag" value={run.posts_per_hashtag} />
        <Meta label="Max enrich" value={run.max_enrich} />
        <Meta label="Started" value={run.started_at ? new Date(run.started_at).toLocaleString() : "not yet"} />
      </div>

      {log && (
        <section>
          <p className="text-xs uppercase tracking-wide text-fg-faint mb-3">Log (last 60 lines)</p>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-bg-elevated border border-border-soft rounded-lg p-4 max-h-96 overflow-y-auto scrollbar-thin text-fg-muted">
            {log}
          </pre>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; fg: string }> = {
    proposed: { bg: "var(--amber-soft)", fg: "var(--amber)" },
    queued: { bg: "rgba(107,102,86,0.1)", fg: "var(--fg-muted)" },
    running: { bg: "var(--amber-soft)", fg: "var(--amber)" },
    succeeded: { bg: "var(--accent-soft)", fg: "var(--accent)" },
    failed: { bg: "rgba(107,102,86,0.1)", fg: "var(--fg-faint)" },
  };
  const style = styles[status] ?? styles.queued;
  return (
    <span
      className="px-3 py-1.5 rounded-full text-xs uppercase tracking-wide font-medium"
      style={{ background: style.bg, color: style.fg }}
    >
      {status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-serif text-3xl tabular">{value}</div>
      <div className="text-xs uppercase tracking-wide text-fg-faint mt-1">{label}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex justify-between hairline py-2 first:border-t-0">
      <span className="text-fg-faint">{label}</span>
      <span className="font-mono text-right">{value ?? "n/a"}</span>
    </div>
  );
}
