"use server";

import { revalidatePath } from "next/cache";
import { pool } from "./db";
import type { LeadStatus } from "./types";

export async function setLeadStatus(id: number, status: LeadStatus) {
  await pool.query(`UPDATE business_entity SET status = $1, updated_at = now() WHERE id = $2`, [
    status,
    id,
  ]);
  revalidatePath("/");
  revalidatePath(`/leads/${id}`);
}
