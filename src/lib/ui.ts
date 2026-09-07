export type Tier = "strong" | "good" | "fair" | "weak";

export function scoreTier(score: number | null): Tier {
  const s = score ?? 0;
  if (s >= 45) return "strong";
  if (s >= 30) return "good";
  if (s >= 15) return "fair";
  return "weak";
}

export const tierColor: Record<Tier, string> = {
  strong: "var(--accent)",
  good: "var(--amber)",
  fair: "var(--fg-muted)",
  weak: "var(--fg-faint)",
};

export const tierLabel: Record<Tier, string> = {
  strong: "Strong",
  good: "Good",
  fair: "Worth a look",
  weak: "Weak",
};

export const websiteStatusLabel: Record<string, string> = {
  UNCHECKED: "Unchecked",
  NO_WEBSITE: "No website",
  SOCIAL_ONLY: "Social only",
  BROKEN_WEBSITE: "Broken website",
  WEBSITE_UNCERTAIN: "Uncertain",
  WEBSITE_EXISTS: "Has website",
};

export const leadStatusLabel: Record<string, string> = {
  new: "New",
  scored: "Scored",
  shortlisted: "Shortlisted",
  contacted: "Contacted",
  rejected: "Dismissed",
};

export function formatFollowers(n: number | null): string {
  if (n === null) return "n/a";
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "n/a";
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}
