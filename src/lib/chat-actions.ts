"use server";

import { execFile, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pool } from "./db";

const execFileAsync = promisify(execFile);

// Trailing space is real -- it's the actual directory name on disk.
const PROJECT_DIR = "/Users/Ted/client finder ";
const PYTHON = path.join(PROJECT_DIR, "venv", "bin", "python3");

export async function sendChatMessage(formData: FormData) {
  const message = ((formData.get("message") as string) || "").trim();
  const sessionId = Number(formData.get("sessionId"));
  if (!message || !sessionId) return;

  // Any failure here -- Gemini's quota, a network blip, whatever comes up
  // later -- must show up as a normal message in the chat, never as an
  // unhandled crash of the whole page. execFile rejects the promise on a
  // non-zero exit code (which console_agent.py uses on error), so the
  // happy-path stdout destructuring never even runs in that case; this
  // has to be a real try/catch around the whole call, not just an `if`
  // check on a successful result.
  let errorMessage: string | null = null;

  try {
    const { stdout } = await execFileAsync(
      PYTHON,
      [path.join(PROJECT_DIR, "console_agent.py"), message, "--session-id", String(sessionId)],
      {
        cwd: PROJECT_DIR,
        // Browser-driven tools (message_on_instagram, browse_and_screenshot)
        // can genuinely take a couple of minutes with Ollama -- 90s was fine
        // for plain lookups but killed the process mid-task for these.
        timeout: 300000,
      }
    );
    const result = JSON.parse(stdout.trim());
    if (result.error) errorMessage = result.error;
  } catch (err) {
    const execErr = err as { stdout?: string; message?: string };
    if (execErr.stdout) {
      try {
        const parsed = JSON.parse(execErr.stdout.trim());
        errorMessage = parsed.error || execErr.message || String(err);
      } catch {
        errorMessage = execErr.message || String(err);
      }
    } else {
      errorMessage = execErr.message || String(err);
    }
  }

  if (errorMessage) {
    await pool.query(
      `INSERT INTO console_messages (session_id, role, content) VALUES ($1, 'model', $2)`,
      [sessionId, `Sorry, I hit an error and couldn't respond: ${errorMessage}`]
    );
  }

  revalidatePath(`/chat/${sessionId}`);
  revalidatePath("/chat", "layout");
}

export async function createNewChatSession() {
  const res = await pool.query(`INSERT INTO chat_sessions DEFAULT VALUES RETURNING id`);
  redirect(`/chat/${res.rows[0].id}`);
}

export async function deleteChatSession(sessionId: number, wasActive: boolean) {
  // console_messages has ON DELETE CASCADE on session_id, so this also
  // removes that session's whole transcript -- there's no separate
  // cleanup step.
  await pool.query(`DELETE FROM chat_sessions WHERE id = $1`, [sessionId]);
  revalidatePath("/chat", "layout");
  // Deleting the conversation you're currently looking at leaves that
  // route pointing at a session that no longer exists -- send the viewer
  // back to /chat, which resolves to whatever's now most recently active.
  if (wasActive) {
    redirect("/chat");
  }
}

export async function confirmRunProposal(runId: number) {
  const res = await pool.query(`SELECT * FROM pipeline_run WHERE id = $1 AND status = 'proposed'`, [runId]);
  const run = res.rows[0];
  if (!run) throw new Error(`No proposed run with id ${runId} -- it may have already been confirmed or declined.`);

  const logDir = path.join(PROJECT_DIR, "exports", "run_logs");
  fs.mkdirSync(logDir, { recursive: true });
  const logFd = fs.openSync(path.join(logDir, `run_${runId}.log`), "a");

  const args = [
    path.join(PROJECT_DIR, "run.py"),
    "--run-id", String(runId),
    "--posts-per-hashtag", String(run.posts_per_hashtag || 25),
    "--max-enrich", String(run.max_enrich || 80),
  ];
  if (run.niche) args.push("--niche", run.niche);
  if (run.location) args.push("--location", run.location);
  if (run.hashtags) args.push("--hashtags", run.hashtags);

  const child = spawn(PYTHON, args, {
    cwd: PROJECT_DIR,
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });
  child.unref();

  revalidatePath("/chat", "layout");
  revalidatePath("/runs");
}

export async function declineRunProposal(runId: number) {
  await pool.query(`DELETE FROM pipeline_run WHERE id = $1 AND status = 'proposed'`, [runId]);
  revalidatePath("/chat", "layout");
}
