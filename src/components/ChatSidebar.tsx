"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createNewChatSession, deleteChatSession } from "@/lib/chat-actions";
import type { ChatSession } from "@/lib/types";

const STORAGE_KEY = "chat-sidebar-collapsed";

export function ChatSidebar({ sessions, activeId }: { sessions: ChatSession[]; activeId: number }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Reading a per-viewer preference from localStorage can only happen
    // after mount (SSR has no window) -- the resulting one-time state
    // update right after mount is the intended use of this effect, not an
    // accidental one.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function handleDelete(id: number, title: string | null, e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Delete "${title || "New chat"}"? This can't be undone.`)) return;
    deleteChatSession(id, id === activeId);
  }

  if (collapsed) {
    return (
      <div className="shrink-0 h-screen sticky top-0 px-2 py-6">
        <button
          type="button"
          onClick={toggle}
          title="Show sidebar"
          className="p-2 rounded-lg text-fg-faint hover:text-fg hover:bg-bg-hover cursor-pointer"
        >
          <PanelIcon />
        </button>
      </div>
    );
  }

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-border-soft h-screen sticky top-0 px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-sm text-fg-faint hover:text-fg-muted">
          ← All prospects
        </Link>
        <button
          type="button"
          onClick={toggle}
          title="Hide sidebar"
          className="p-1.5 -mr-1.5 rounded-lg text-fg-faint hover:text-fg hover:bg-bg-hover cursor-pointer"
        >
          <PanelIcon />
        </button>
      </div>

      <form action={createNewChatSession} className="mb-6">
        <button
          type="submit"
          className="w-full px-4 py-2 rounded-full text-sm border border-border text-fg-muted hover:text-fg cursor-pointer"
        >
          New chat
        </button>
      </form>

      <p className="text-xs tracking-[0.15em] uppercase text-fg-faint mb-3 px-1">History</p>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-1 -mx-1 px-1">
        {sessions.length === 0 ? (
          <p className="text-xs text-fg-faint px-2">No past conversations yet.</p>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="group relative">
              <Link
                href={`/chat/${s.id}`}
                className={`block pl-3 pr-8 py-2 rounded-lg text-sm truncate transition-colors ${
                  s.id === activeId
                    ? "bg-bg-hover text-fg"
                    : "text-fg-muted hover:bg-bg-hover hover:text-fg"
                }`}
              >
                {s.title || "New chat"}
              </Link>
              <button
                type="button"
                onClick={(e) => handleDelete(s.id, s.title, e)}
                title="Delete chat"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-fg-faint opacity-0 group-hover:opacity-100 hover:text-fg hover:bg-bg transition-opacity cursor-pointer"
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 4.5h10M6.5 4.5v-1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M6.5 7.5v4M9.5 7.5v4M4 4.5l.6 8a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
