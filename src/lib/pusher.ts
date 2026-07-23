import Pusher from "pusher";

// Server-side Pusher instance — used in API routes to trigger events
// Falls back gracefully when env vars not set (e.g. local dev without Pusher account)
export const pusherServer = process.env.PUSHER_APP_ID
  ? new Pusher({
      appId:   process.env.PUSHER_APP_ID!,
      key:     process.env.PUSHER_APP_KEY!,
      secret:  process.env.PUSHER_APP_SECRET!,
      cluster: process.env.PUSHER_CLUSTER ?? "ap2",
      useTLS:  true,
    })
  : null;

export async function triggerPusher(
  channel: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(channel, event, data);
  } catch {
    // Pusher errors are non-fatal — app still works via polling fallback
  }
}
