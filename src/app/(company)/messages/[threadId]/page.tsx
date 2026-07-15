"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

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
    job_request: { title: string };
    agency: { name_ar: string };
  };
}

export default function CompanyThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/messages/threads/${threadId}`);
    if (res.ok) {
      const data = await res.json();
      setThread(data.thread);
      setMessages(data.messages ?? []);
    }
  }

  useEffect(() => {
    load();
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch(`/api/messages/threads/${threadId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, isInternalNote }),
    });
    if (res.ok) {
      setBody("");
      setIsInternalNote(false);
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
        <p className="text-sm text-gray-500">{thread.proposal.agency.name_ar}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.map((msg) => {
          const isCompany = msg.senderType === "COMPANY";
          return (
            <div key={msg.id} className={`flex ${isCompany ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.isInternalNote
                    ? "border-2 border-dashed border-yellow-400 bg-yellow-50 text-yellow-800"
                    : isCompany
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.isInternalNote && (
                  <div className="text-xs font-semibold mb-1 text-yellow-600">ملاحظة داخلية</div>
                )}
                <p>{msg.body}</p>
                <div className={`text-xs mt-1 ${isCompany && !msg.isInternalNote ? "text-blue-200" : "text-gray-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="internal-note"
            checked={isInternalNote}
            onChange={(e) => setIsInternalNote(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="internal-note" className="text-sm text-gray-600">إضافة ملاحظة داخلية</label>
        </div>
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
