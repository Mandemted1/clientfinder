export type WebsiteStatus =
  | "UNCHECKED"
  | "NO_WEBSITE"
  | "SOCIAL_ONLY"
  | "BROKEN_WEBSITE"
  | "WEAK_WEBSITE"
  | "WEBSITE_UNCERTAIN"
  | "WEBSITE_EXISTS";

export type LeadStatus = "new" | "scored" | "shortlisted" | "contacted" | "rejected";

export interface Business {
  id: number;
  ig_username: string | null;
  source: "instagram" | "google_maps" | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  maps_url: string | null;
  rating: number | null;
  reviews_count: number | null;
  is_solid: boolean | null;
  canonical_name: string | null;
  niche: string | null;
  country: string | null;

  followers: number | null;
  following: number | null;
  posts_count: number | null;
  bio: string | null;
  external_url: string | null;
  external_urls_all: string | null;
  is_business_account: boolean | null;
  business_category_name: string | null;

  website_status: WebsiteStatus;
  website_url: string | null;
  website_evidence: string | null;

  score: number | null;
  score_breakdown: Record<string, number> | null;

  ai_category: string | null;
  ai_activity_level: string | null;
  ai_buying_intent: string | null;
  ai_pitch: string | null;
  ai_reason: string | null;

  status: LeadStatus;
  discovered_at: string;
  updated_at: string;
}

export interface DiscoveryRow {
  caption: string | null;
  likes: number | null;
  comments_count: number | null;
  post_timestamp: string | null;
}

export type MessageSender = "agent" | "ted" | "prospect";

export interface Message {
  id: number;
  business_id: number;
  channel: string;
  sender: MessageSender;
  content: string;
  brain_sources: { path: string; heading: string | null }[] | null;
  sent_at: string;
}

export type PendingActionStatus = "pending" | "approved" | "sent" | "rejected" | "edited";

export interface PendingAction {
  id: number;
  business_id: number;
  drafted_text: string;
  final_text: string | null;
  brain_sources: { path: string; heading: string | null }[] | null;
  status: PendingActionStatus;
  created_at: string;
  resolved_at: string | null;
}

export type ConsoleRole = "user" | "model" | "tool";

export interface ChatSession {
  id: number;
  title: string | null;
  created_at: string;
  last_activity_at: string;
}

export interface ConsoleMessage {
  id: number;
  session_id: number;
  role: ConsoleRole;
  content: string | null;
  tool_name: string | null;
  tool_call_id: string | null;
  tool_args: Record<string, unknown> | null;
  tool_result: Record<string, unknown> | null;
  thought_signature: string | null;
  created_at: string;
}

export interface Stats {
  total: number;
  enriched: number;
  verified: number;
  prospects: number;
  disqualified: number;
  dismissed: number;
  pending: number;
  byWebsiteStatus: Record<string, number>;
}

export type RunStatus = "proposed" | "queued" | "running" | "succeeded" | "failed";

export interface RunStats {
  discovered: number;
  enriched: number;
  verified: number;
  prospects: number;
}

export interface PipelineRun {
  id: number;
  niche: string | null;
  location: string | null;
  hashtags: string | null;
  posts_per_hashtag: number | null;
  max_enrich: number | null;
  status: RunStatus;
  stage: string | null;
  error: string | null;
  stats: RunStats | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}
