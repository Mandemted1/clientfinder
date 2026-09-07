"use client";

import { useOptimistic, useRef, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { sendChatMessage } from "@/lib/chat-actions";
import type { Turn } from "@/lib/chatTurns";

export function ChatThread({ sessionId, initialTurns }: { sessionId: number; initialTurns: Turn[] }) {
  const [optimisticTurns, addOptimisticTurn] = useOptimistic(
    initialTurns,
    (state: Turn[], turn: Turn) => [...state, turn]
  );
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    // Guards against an actual second request firing while one's still in
    // flight (that would race against it in the same shared conversation
    // history) -- but doesn't touch the input itself, so typing the next
    // message while this one's thinking still works.
    if (isPending) return;

    const message = (formData.get("message") as string)?.trim();
    if (!message) return;
    formRef.current?.reset();

    startTransition(async () => {
      addOptimisticTurn({ kind: "user", content: message });
      addOptimisticTurn({ kind: "thinking" });
      await sendChatMessage(formData);
    });
  }

  return (
    <>
      <div className="flex-1 space-y-4 mb-8">
        {optimisticTurns.length === 0 ? (
          <p className="text-sm text-fg-faint">
            Ask it something -- &ldquo;how many prospects do I have&rdquo;, &ldquo;find me beauty
            salons in Lagos&rdquo;, &ldquo;what&rsquo;s the top lead right now&rdquo;.
          </p>
        ) : (
          optimisticTurns.map((turn, i) => <TurnView key={i} turn={turn} />)
        )}
      </div>

      <form ref={formRef} action={handleSubmit} className="sticky bottom-0 pt-4 pb-2 bg-bg">
        <input type="hidden" name="sessionId" defaultValue={sessionId} />
        <div className="flex gap-2">
          <input
            name="message"
            placeholder={isPending ? "still thinking about the last one -- go ahead and type the next..." : "ask the agent anything..."}
            autoComplete="off"
            className="flex-1 bg-transparent border border-border rounded-full px-4 py-2.5 text-sm focus:border-accent outline-none transition-colors placeholder:text-fg-faint"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-full text-sm cursor-pointer disabled:opacity-50 disabled:cursor-default"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            Send
          </button>
        </div>
      </form>
    </>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  if (turn.kind === "user") {
    return (
      <div className="text-right">
        <div
          className="inline-block max-w-[85%] text-left px-4 py-2.5 rounded-xl text-sm"
          style={{ background: "var(--accent-soft)" }}
        >
          {turn.content}
        </div>
      </div>
    );
  }

  if (turn.kind === "tools") {
    return (
      <div className="text-xs text-fg-faint font-mono">
        used: {turn.names.join(", ")}
      </div>
    );
  }

  if (turn.kind === "screenshot") {
    return (
      <div>
        <div
          className="inline-block max-w-[85%] p-2 rounded-xl"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-soft)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={turn.url} alt="Browser screenshot" className="rounded-lg max-w-full" />
          {turn.note && <p className="text-xs text-fg-faint mt-2 px-1">{turn.note}</p>}
        </div>
      </div>
    );
  }

  if (turn.kind === "thinking") {
    return (
      <div>
        <div
          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-soft)" }}
        >
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </div>
        <style>{`
          .thinking-dot {
            width: 6px; height: 6px; border-radius: 999px;
            background: var(--fg-faint);
            animation: thinking-bounce 1.1s infinite ease-in-out;
          }
          .thinking-dot:nth-child(2) { animation-delay: 0.15s; }
          .thinking-dot:nth-child(3) { animation-delay: 0.3s; }
          @keyframes thinking-bounce {
            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-2px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <div
        className="inline-block max-w-[85%] px-4 py-2.5 rounded-xl text-sm [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_strong]:font-semibold"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-soft)" }}
      >
        <ReactMarkdown>{turn.content}</ReactMarkdown>
      </div>
    </div>
  );
}
