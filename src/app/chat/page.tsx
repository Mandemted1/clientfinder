import { redirect } from "next/navigation";
import { getActiveSessionId } from "@/lib/queries";

export default async function ChatIndexPage() {
  const sessionId = await getActiveSessionId();
  redirect(`/chat/${sessionId}`);
}
