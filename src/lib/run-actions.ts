"use server";

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pool } from "./db";
import { getActiveRun } from "./queries";

// Trailing space is real -- it's the actual directory name on disk.
const PROJECT_DIR = "/Users/Ted/client finder ";
const PYTHON = path.join(PROJECT_DIR, "venv", "bin", "python3");
const SCRIPT = path.join(PROJECT_DIR, "run.py");

export async function startRun(formData: FormData): Promise<void> {
  const active = await getActiveRun();
  if (active) {
    throw new Error(
      `A run is already in progress (started as run #${active.id}). Wait for it to finish before starting another -- concurrent runs would race on the same Apify credits and corrupt per-run stats.`
    );
  }

  const niche = ((formData.get("niche") as string) || "").trim();
  const location = ((formData.get("location") as string) || "").trim();
  const hashtagsRaw = ((formData.get("hashtags") as string) || "").trim();
  const postsPerHashtag = Number(formData.get("posts_per_hashtag")) || 25;
  const maxEnrich = Number(formData.get("max_enrich")) || 80;

  const hashtags = hashtagsRaw
    .split(",")
    .map((h) => h.trim().replace(/^#/, ""))
    .filter(Boolean);

  const res = await pool.query(
    `INSERT INTO pipeline_run (niche, location, hashtags, posts_per_hashtag, max_enrich)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [niche, location, hashtags.join(","), postsPerHashtag, maxEnrich]
  );
  const runId: number = res.rows[0].id;

  const logDir = path.join(PROJECT_DIR, "exports", "run_logs");
  fs.mkdirSync(logDir, { recursive: true });
  const logFd = fs.openSync(path.join(logDir, `run_${runId}.log`), "a");

  const args = [
    SCRIPT,
    "--run-id", String(runId),
    "--posts-per-hashtag", String(postsPerHashtag),
    "--max-enrich", String(maxEnrich),
  ];
  if (niche) args.push("--niche", niche);
  if (location) args.push("--location", location);
  if (hashtags.length > 0) args.push("--hashtags", hashtags.join(","));

  const child = spawn(PYTHON, args, {
    cwd: PROJECT_DIR,
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });
  child.unref();

  revalidatePath("/runs");
  redirect(`/runs/${runId}`);
}
