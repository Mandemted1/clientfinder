import { draftReply, approveDraft, rejectDraft } from "@/lib/conversation-actions";
import { timeAgo } from "@/lib/ui";
import type { Message, PendingAction } from "@/lib/types";

// wa.me wants the full international number, digits only.
function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
}

export function ConversationPanel({
  businessId,
  messages,
  pending,
  whatsappPhone = null,
}: {
  businessId: number;
  messages: Message[];
  pending: PendingAction | null;
  whatsappPhone?: string | null;
}) {
  return (
    <div>
      {messages.length > 0 && (
        <div className="space-y-3 mb-8">
          {messages.map((m) => (
            <div key={m.id} className={m.sender === "prospect" ? "" : "text-right"}>
              <div
                className="inline-block max-w-[85%] text-left px-4 py-2.5 rounded-xl text-sm"
                style={
                  m.sender === "prospect"
                    ? { background: "var(--bg-elevated)", border: "1px solid var(--border-soft)" }
                    : { background: "var(--accent-soft)", color: "var(--fg)" }
                }
              >
                {m.content}
              </div>
              <div className="text-[11px] text-fg-faint mt-1 font-mono">
                {m.sender === "prospect" ? "them" : m.sender} · {timeAgo(m.sent_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {pending ? (
        <form
          action={approveDraft.bind(null, businessId, pending.id)}
          className="p-4 rounded-lg"
          style={{ background: "var(--amber-soft)" }}
        >
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--amber)" }}>
            {whatsappPhone ? "Ready to send on WhatsApp" : "Waiting on your approval"}
          </p>
          <textarea
            name="edited_text"
            defaultValue={pending.drafted_text}
            rows={3}
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:border-accent outline-none transition-colors"
          />
          {whatsappPhone && (
            <p className="text-[11px] text-fg-faint mt-2">
              WhatsApp opens with the drafted text. If you edit it above, edit it in WhatsApp too, then
              come back and press Mark as sent so the follow-up clock starts.
            </p>
          )}
          {pending.brain_sources && pending.brain_sources.length > 0 && (
            <p className="text-[11px] text-fg-faint mt-2 font-mono">
              drew from: {pending.brain_sources.map((s) => s.heading || s.path).join(", ")}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {whatsappPhone && (
              <a
                href={waLink(whatsappPhone, pending.drafted_text)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full text-sm"
                style={{ background: "#25D366", color: "#fff" }}
              >
                Send on WhatsApp
              </a>
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded-full text-sm cursor-pointer"
              style={{ background: "var(--accent)", color: "var(--on-accent)" }}
            >
              {whatsappPhone ? "Mark as sent" : "Approve"}
            </button>
            <button
              formAction={rejectDraft.bind(null, businessId, pending.id)}
              className="px-4 py-2 rounded-full text-sm border border-border text-fg-muted hover:text-fg cursor-pointer"
            >
              Reject
            </button>
          </div>
        </form>
      ) : (
        <form action={draftReply.bind(null, businessId)}>
          <label className="text-xs uppercase tracking-wide text-fg-faint block mb-2">
            {whatsappPhone ? "Paste their reply" : "Simulate their next message"}
          </label>
          <textarea
            name="message"
            rows={2}
            placeholder={whatsappPhone ? "paste what they sent on WhatsApp, to get a drafted reply" : "type what the prospect said, to get a drafted reply"}
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:border-accent outline-none transition-colors placeholder:text-fg-faint"
          />
          <button
            type="submit"
            className="mt-3 px-4 py-2 rounded-full text-sm cursor-pointer"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            Get draft reply
          </button>
        </form>
      )}
    </div>
  );
}
