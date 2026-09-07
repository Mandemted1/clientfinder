import { getChatSessions } from "@/lib/queries";
import { ChatSidebar } from "@/components/ChatSidebar";

export default async function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const activeId = Number(sessionId);
  const sessions = await getChatSessions();

  return (
    <div className="flex-1 flex w-full min-h-0">
      <ChatSidebar sessions={sessions} activeId={activeId} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
