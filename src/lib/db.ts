import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

// Neon's pooled endpoint (recommended for serverless -- it's what avoids
// exhausting Postgres's connection limit under many short-lived function
// invocations) didn't reliably pick up this project's search_path
// default, even after it was set correctly at both the role and database
// level -- confirmed live, the direct/unpooled endpoint had it right
// immediately, the pooled one still returned an empty search_path.
//
// The "correct" fix -- passing search_path as a libpq startup parameter
// via Pool's `options` -- doesn't work here either: Neon's pooler
// actively rejects it ("unsupported startup parameter", confirmed live).
// So this runs it as a follow-up query on every new connection instead.
// pg logs a "query already executing" deprecation warning for this
// pattern (it doesn't block handing the connection out on the promise),
// but the two queries still run in the order they're sent on the same
// underlying connection -- verified across 10 fresh connections in a
// row, all correct, not just working by luck once.
pool.on("connect", (client) => {
  client.query("SET search_path TO public");
});

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}
