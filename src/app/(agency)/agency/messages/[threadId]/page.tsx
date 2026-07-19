"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Pusher from "pusher-js";

interface Message {
  id: string;
  senderType: string;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
}

interface Thread {
  id: string;
  proposal: {
    job_request: { title: string; company: { name_ar: string } };
  };
}

export default function AgencyThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages/threads/${threadId}`);
    if (res.ok) {
      const data = await res.json();
      setThread(data.thread);
      setMessages(data.messages ?? []);
    }
  }, [threadId]);

  useEffect(() => {
    load();

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (pusherKey && threadId) {
      const pusher = new Pusher(pusherKey, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "ap2",
      });
      const channel = pusher.subscribe(`thread-${threadId}`);
      channel.bind("new-message", (data: Message) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      });
      return () => {
        channel.unbind_all();
        pusher.unsubscribe(`thread-${threadId}`);
      };
    }

    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch(`/api/messages/threads/${threadId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      setBody("");
      await load();
    }
    setSending(false);
  }

  if (!thread) return <div className="p-6 text-gray-400">جارٍ التحميل...</div>;

  return (
    <div dir="rtl" className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="font-semibold text-gray-800">{thread.proposal.job_request.title}</h2>
        <p className="text-sm text-gray-500">{thread.proposal.job_request.company?.name_ar}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.map((msg) => {
          const isAgency = msg.senderType === "AGENCY";
          return (
            <div key={msg.id} className={`flex ${isAgency ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                  isAgency ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                <p>{msg.body}</p>
                <div className={`text-xs mt-1 ${isAgency ? "text-blue-200" : "text-gray-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب رسالتك..."
            rows={2}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            onClick={send}
            disabled={sending || !body.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
