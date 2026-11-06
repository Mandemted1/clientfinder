import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBusiness, getDiscoveryRows, getConversationMessages, getPendingActionForBusiness,
} from "@/lib/queries";
import { ScoreMark } from "@/components/ScoreMark";
import { StatusPill } from "@/components/StatusPill";
import { LeadStatusActions } from "@/components/LeadStatusActions";
import { ConversationPanel } from "@/components/ConversationPanel";
import { formatFollowers, timeAgo } from "@/lib/ui";

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!Number.isFinite(businessId)) notFound();

  const business = await getBusiness(businessId);
  if (!business) notFound();

  const [discovery, messages, pending] = await Promise.all([
    getDiscoveryRows(businessId),
    getConversationMessages(businessId),
    getPendingActionForBusiness(businessId),
  ]);
  const breakdown = business.score_breakdown ?? {};

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-6 md:px-10 py-14">
      <Link href="/" className="text-sm text-fg-faint hover:text-fg-muted">
        ← All prospects
      </Link>

      <header className="mt-8 flex items-start gap-5">
        <ScoreMark score={business.score} size="lg" />
        <div className="min-w-0">
          <h1 className="font-serif italic text-4xl leading-tight">
            {business.canonical_name || business.ig_username}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {business.ig_username && (
              <a
                href={`https://instagram.com/${business.ig_username}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-sm text-accent hover:underline"
              >
                @{business.ig_username}
              </a>
            )}
            {business.maps_url && (
              <a href={business.maps_url} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                Google Maps
              </a>
            )}
            {business.phone && (
              <a
                href={`https://wa.me/${business.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-sm text-accent hover:underline"
              >
                {business.phone}
              </a>
            )}
            {business.ai_category && (
              <span className="text-sm text-fg-muted">{business.ai_category}</span>
            )}
            {business.country && <span className="text-sm text-fg-faint">{business.country}</span>}
          </div>
        </div>
      </header>

      {business.source === "google_maps" ? (
        <div className="flex flex-wrap gap-x-10 gap-y-4 mt-10 py-6 hairline">
          <Meta label="Google reviews" value={business.reviews_count ?? 0} />
          <Meta label="Rating" value={business.rating ? `${business.rating}★` : "n/a"} />
          <Meta label="Website" value={business.website_url ? business.website_status : "None"} />
          <Meta label="Address" value={business.address ?? "n/a"} />
          <Meta label="Discovered" value={timeAgo(business.discovered_at)} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-x-10 gap-y-4 mt-10 py-6 hairline">
          <Meta label="Followers" value={formatFollowers(business.followers)} />
          <Meta label="Following" value={formatFollowers(business.following)} />
          <Meta label="Posts" value={business.posts_count ?? "n/a"} />
          <Meta label="Business account" value={business.is_business_account ? "Yes" : "No"} />
          <Meta label="Discovered" value={timeAgo(business.discovered_at)} />
        </div>
      )}

      {business.ai_reason && (
        <p className="font-serif italic text-2xl leading-snug mt-10 text-fg">
          &ldquo;{business.ai_reason}&rdquo;
        </p>
      )}

      {business.ai_pitch && (
        <div className="mt-8 pl-5 border-l-2" style={{ borderColor: "var(--accent)" }}>
          <p className="text-xs uppercase tracking-wide text-fg-faint mb-2">
            {business.source === "google_maps" ? "Call script (if no WhatsApp reply in 2 days)" : "Suggested opening"}
          </p>
          <p className="text-fg-muted leading-relaxed">{business.ai_pitch}</p>
        </div>
      )}

      <section className="mt-14">
        <SectionLabel>Conversation</SectionLabel>
        <ConversationPanel
          businessId={business.id}
          messages={messages}
          pending={pending}
          whatsappPhone={business.source === "google_maps" ? business.phone : null}
        />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-14">
        <section>
          <SectionLabel>Website</SectionLabel>
          <StatusPill status={business.website_status} />
          {business.website_evidence && (
            <p className="text-sm text-fg-muted leading-relaxed mt-3">{business.website_evidence}</p>
          )}
          {business.website_url && (
            <a
              href={business.website_url}
              target="_blank"
              rel="noreferrer"
              className="block mt-2 text-sm text-accent hover:underline break-all"
            >
              {business.website_url}
            </a>
          )}
        </section>

        <section>
          <SectionLabel>Signals</SectionLabel>
          <div className="text-sm">
            {business.ai_activity_level && (
              <SignalRow label="Activity" value={business.ai_activity_level} />
            )}
            {business.ai_buying_intent && (
              <SignalRow label="Buying intent" value={business.ai_buying_intent} />
            )}
          </div>
        </section>
      </div>

      <section className="mt-14">
        <SectionLabel>Score breakdown</SectionLabel>
        <div className="font-mono text-sm">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1.5 hairline first:border-t-0">
              <span className="text-fg-muted">{key.replace(/_/g, " ")}</span>
              <span className={value < 0 ? "text-fg-faint" : "text-fg"}>
                {value > 0 ? "+" : ""}
                {value}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-2 mt-1 border-t border-fg-faint font-semibold">
            <span>Total</span>
            <span>{business.score}</span>
          </div>
        </div>
      </section>

      {business.bio && (
        <section className="mt-14">
          <SectionLabel>Bio</SectionLabel>
          <p className="text-sm text-fg-muted whitespace-pre-line leading-relaxed">{business.bio}</p>
        </section>
      )}

      {discovery.length > 0 && (
        <section className="mt-14">
          <SectionLabel>Evidence</SectionLabel>
          <div className="space-y-4">
            {discovery.map((row, i) => (
              <div key={i} className="hairline pt-4">
                <p className="text-sm text-fg-muted whitespace-pre-line leading-relaxed">
                  {row.caption}
                </p>
                <div className="flex gap-4 text-xs text-fg-faint mt-2 font-mono">
                  <span>{row.likes ?? 0} likes</span>
                  <span>{row.comments_count ?? 0} comments</span>
                  <span>{timeAgo(row.post_timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 pb-10">
        <SectionLabel>Status</SectionLabel>
        <LeadStatusActions id={business.id} current={business.status} />
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-mono text-sm tabular">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-fg-faint mt-0.5">{label}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-wide text-fg-faint mb-4">{children}</p>;
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 hairline first:border-t-0">
      <span className="text-fg-faint">{label}</span>
      <span className="capitalize">{value}</span>
    </div>
  );
}
