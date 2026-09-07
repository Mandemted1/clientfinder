import type { ConsoleMessage } from "./types";

export type Turn =
  | { kind: "user"; content: string }
  | { kind: "model"; content: string }
  | { kind: "tools"; names: string[] }
  | { kind: "screenshot"; url: string; note?: string }
  | { kind: "thinking" };

export function groupTurns(messages: ConsoleMessage[]): Turn[] {
  const turns: Turn[] = [];
  let pendingTools: string[] = [];

  for (const m of messages) {
    if (m.role === "user") {
      turns.push({ kind: "user", content: m.content || "" });
    } else if (m.role === "model" && m.tool_name) {
      pendingTools.push(m.tool_name);
    } else if (m.role === "tool" && m.tool_name === "browse_and_screenshot") {
      const result = m.tool_result as { screenshot_url?: string; note?: string } | null;
      if (result?.screenshot_url) {
        if (pendingTools.length > 0) {
          turns.push({ kind: "tools", names: pendingTools });
          pendingTools = [];
        }
        turns.push({ kind: "screenshot", url: result.screenshot_url, note: result.note });
      }
    } else if (m.role === "model" && m.content) {
      if (pendingTools.length > 0) {
        turns.push({ kind: "tools", names: pendingTools });
        pendingTools = [];
      }
      turns.push({ kind: "model", content: m.content });
    }
  }
  return turns;
}
