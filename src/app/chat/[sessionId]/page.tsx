import { notFound } from "next/navigation";
import { getConsoleMessages, getProposedRuns } from "@/lib/queries";
import { confirmRunProposal, declineRunProposal } from "@/lib/chat-actions";
import { ChatThread } from "@/components/ChatThread";
import { groupTurns } from "@/lib/chatTurns";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const id = Number(sessionId);
  if (!Number.isFinite(id)) notFound();

  const [messages, proposedRuns] = await Promise.all([
    getConsoleMessages(id),
    getProposedRuns(),
  ]);

  const turns = groupTurns(messages);

  return (
    <div className="max-w-3xl w-full mx-auto px-6 md:px-10 py-14 flex flex-col">
      <header className="mb-10">
        <p className="text-xs tracking-[0.2em] uppercase text-fg-faint mb-4">
          Client acquisition engine
        </p>
        <h1 className="font-serif italic text-5xl leading-none">Chat</h1>
        <p className="text-sm text-fg-muted mt-4">
          Talk to the agent that sees everything -- leads, scores, runs, the sales brain.
          It can look things up and draft replies freely; anything that costs money or reaches
          a real person always comes back here for you to confirm first.
        </p>
      </header>

      {proposedRuns.length > 0 && (
        <div className="mb-10 space-y-3">
          {proposedRuns.map((run) => (
            <div key={run.id} className="p-5 rounded-lg" style={{ background: "var(--amber-soft)" }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--amber)" }}>
                Proposed run -- not started, costs Apify credit if confirmed
              </p>
              <p className="text-sm text-fg mb-1">
                {run.niche} <span className="text-fg-faint">/</span> {run.location}
              </p>
              <p className="text-xs text-fg-faint font-mono mb-4">
                hashtags: {run.hashtags} · {run.posts_per_hashtag} posts/hashtag · up to {run.max_enrich} enriched
              </p>
              <div className="flex gap-2">
                <form action={confirmRunProposal.bind(null, run.id)}>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full text-sm cursor-pointer"
                    style={{ background: "var(--accent)", color: "var(--on-accent)" }}
                  >
                    Confirm & run
                  </button>
                </form>
                <form action={declineRunProposal.bind(null, run.id)}>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full text-sm border border-border text-fg-muted hover:text-fg cursor-pointer"
                  >
                    Decline
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <ChatThread key={id} sessionId={id} initialTurns={turns} />
    </div>
  );
}
