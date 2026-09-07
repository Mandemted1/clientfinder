import { pool } from "./db";
import type {
  Business, DiscoveryRow, Stats, WebsiteStatus, PipelineRun, Message, PendingAction, ConsoleMessage, ChatSession,
} from "./types";

export async function getStats(): Promise<Stats> {
  const [totalRes, enrichedRes, statusRes, dismissedRes] = await Promise.all([
    pool.query(`SELECT count(*)::int AS n FROM business_entity`),
    pool.query(`SELECT count(*)::int AS n FROM business_entity WHERE followers IS NOT NULL`),
    pool.query(
      `SELECT website_status, count(*)::int AS n FROM business_entity GROUP BY website_status`
    ),
    pool.query(`SELECT count(*)::int AS n FROM business_entity WHERE status = 'rejected'`),
  ]);

  const byWebsiteStatus: Record<string, number> = {};
  for (const row of statusRes.rows) {
    byWebsiteStatus[row.website_status] = row.n;
  }

  const verified = Object.entries(byWebsiteStatus)
    .filter(([k]) => k !== "UNCHECKED")
    .reduce((sum, [, n]) => sum + n, 0);
  const disqualified = byWebsiteStatus["WEBSITE_EXISTS"] || 0;
  const dismissed = dismissedRes.rows[0].n;
  const prospects = verified - disqualified - dismissed;
  const pending = byWebsiteStatus["UNCHECKED"] || 0;

  return {
    total: totalRes.rows[0].n,
    enriched: enrichedRes.rows[0].n,
    verified,
    prospects,
    disqualified,
    dismissed,
    pending,
    byWebsiteStatus,
  };
}

export type LeadView = "prospects" | "disqualified" | "dismissed" | "all";
export type SortKey = "score" | "followers" | "recent";

export async function getLeads(opts: {
  view?: LeadView;
  websiteStatus?: WebsiteStatus | "all";
  sort?: SortKey;
  q?: string;
  leadStatus?: string;
}): Promise<Business[]> {
  const { view = "prospects", websiteStatus = "all", sort = "score", q, leadStatus } = opts;

  const conditions: string[] = ["score IS NOT NULL"];
  const params: unknown[] = [];

  if (view === "prospects") {
    conditions.push(`website_status != 'WEBSITE_EXISTS'`, `status != 'rejected'`);
  } else if (view === "disqualified") {
    conditions.push(`website_status = 'WEBSITE_EXISTS'`);
  } else if (view === "dismissed") {
    conditions.push(`status = 'rejected'`);
  }

  if (websiteStatus !== "all") {
    params.push(websiteStatus);
    conditions.push(`website_status = $${params.length}`);
  }

  if (leadStatus && leadStatus !== "all") {
    params.push(leadStatus);
    conditions.push(`status = $${params.length}`);
  }

  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(canonical_name ILIKE $${params.length} OR ig_username ILIKE $${params.length} OR bio ILIKE $${params.length})`
    );
  }

  const orderBy =
    sort === "followers"
      ? "followers DESC NULLS LAST"
      : sort === "recent"
        ? "discovered_at DESC"
        : "score DESC";

  const sql = `
    SELECT * FROM business_entity
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${orderBy}
    LIMIT 300
  `;

  const res = await pool.query(sql, params);
  return res.rows;
}

export async function getBusiness(id: number): Promise<Business | null> {
  const res = await pool.query(`SELECT * FROM business_entity WHERE id = $1`, [id]);
  return res.rows[0] ?? null;
}

export async function getDiscoveryRows(businessId: number): Promise<DiscoveryRow[]> {
  const res = await pool.query(
    `SELECT caption, likes, comments_count, post_timestamp
     FROM discovery_source WHERE business_id = $1
     ORDER BY post_timestamp DESC NULLS LAST`,
    [businessId]
  );
  return res.rows;
}

export async function listRuns(limit = 20): Promise<PipelineRun[]> {
  const res = await pool.query(
    `SELECT * FROM pipeline_run ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

export async function getRun(id: number): Promise<PipelineRun | null> {
  const res = await pool.query(`SELECT * FROM pipeline_run WHERE id = $1`, [id]);
  return res.rows[0] ?? null;
}

export async function getActiveRun(): Promise<PipelineRun | null> {
  const res = await pool.query(
    `SELECT * FROM pipeline_run WHERE status IN ('queued', 'running') ORDER BY created_at DESC LIMIT 1`
  );
  return res.rows[0] ?? null;
}

export async function getConversationMessages(businessId: number): Promise<Message[]> {
  const res = await pool.query(
    `SELECT * FROM messages WHERE business_id = $1 ORDER BY sent_at ASC`,
    [businessId]
  );
  return res.rows;
}

export async function getPendingActionForBusiness(businessId: number): Promise<PendingAction | null> {
  const res = await pool.query(
    `SELECT * FROM pending_actions WHERE business_id = $1 AND status = 'pending'
     ORDER BY created_at DESC LIMIT 1`,
    [businessId]
  );
  return res.rows[0] ?? null;
}

// Fallback only, for landing on /chat with no session named in the URL --
// jumps to whichever conversation was most recently active (last message,
// not creation time -- an empty session someone opened and never used
// shouldn't outrank a real conversation), creating one if there's no
// history at all yet. Once a session is open, every read and write names
// it explicitly; "most recent" and "the one Ted is looking at" are
// different things once real history exists.
export async function getActiveSessionId(): Promise<number> {
  const existing = await pool.query(
    `SELECT s.id
     FROM chat_sessions s
     JOIN console_messages m ON m.session_id = s.id
     GROUP BY s.id
     ORDER BY max(m.created_at) DESC
     LIMIT 1`
  );
  if (existing.rows[0]) return existing.rows[0].id;
  const created = await pool.query(
    `INSERT INTO chat_sessions DEFAULT VALUES RETURNING id`
  );
  return created.rows[0].id;
}

// History sidebar -- one row per past conversation that actually has
// messages (an opened-but-never-used session doesn't clutter history,
// same as ChatGPT/Claude), most recent activity first.
export async function getChatSessions(): Promise<ChatSession[]> {
  const res = await pool.query(
    `SELECT s.id, s.title, s.created_at, max(m.created_at) AS last_activity_at
     FROM chat_sessions s
     JOIN console_messages m ON m.session_id = s.id
     GROUP BY s.id
     ORDER BY last_activity_at DESC`
  );
  return res.rows;
}

export async function getConsoleMessages(sessionId: number, limit = 200): Promise<ConsoleMessage[]> {
  const res = await pool.query(
    `SELECT * FROM console_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT $2`,
    [sessionId, limit]
  );
  return res.rows;
}

export async function getProposedRuns(): Promise<PipelineRun[]> {
  const res = await pool.query(
    `SELECT * FROM pipeline_run WHERE status = 'proposed' ORDER BY created_at DESC`
  );
  return res.rows;
}
