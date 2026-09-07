"use server";

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { revalidatePath } from "next/cache";

const execFileAsync = promisify(execFile);

// Trailing space is real -- it's the actual directory name on disk.
const PROJECT_DIR = "/Users/Ted/client finder ";
const PYTHON = path.join(PROJECT_DIR, "venv", "bin", "python3");
const CLI = path.join(PROJECT_DIR, "agent_cli.py");

async function runCli(args: string[]): Promise<Record<string, unknown>> {
  const { stdout } = await execFileAsync(PYTHON, [CLI, ...args], {
    cwd: PROJECT_DIR,
    timeout: 60000,
  });
  const result = JSON.parse(stdout.trim());
  if (result.error) throw new Error(result.error);
  return result;
}

export async function draftReply(businessId: number, formData: FormData) {
  const message = ((formData.get("message") as string) || "").trim();
  if (!message) return;

  await runCli(["draft", String(businessId), message]);
  revalidatePath(`/leads/${businessId}`);
}

export async function approveDraft(businessId: number, actionId: number, formData: FormData) {
  const editedText = ((formData.get("edited_text") as string) || "").trim();
  await runCli(["approve", String(actionId), editedText]);
  revalidatePath(`/leads/${businessId}`);
}

export async function rejectDraft(businessId: number, actionId: number) {
  await runCli(["reject", String(actionId)]);
  revalidatePath(`/leads/${businessId}`);
}
