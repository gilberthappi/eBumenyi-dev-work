import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Maximize2, Minimize2 } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "@/services/chat.service";
import toast from "react-hot-toast";

const PANEL_H = 420;
const PANEL_W = 380;
const PANEL_H_EXPANDED = "85vh";
const PANEL_W_EXPANDED = "min(480px, 95vw)";

export const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const { reply } = await sendChatMessage(text, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      toast.error("Could not get a response. Try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed right-0 z-40 flex flex-col rounded-t-xl border border-gray-200 bg-white shadow-xl transition-[width,height] duration-200"
          style={{
            width: expanded ? PANEL_W_EXPANDED : PANEL_W,
            height: expanded ? PANEL_H_EXPANDED : PANEL_H,
            right: 24,
            bottom: 80,
          }}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <span className="font-semibold text-gray-800">Assistant</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label={expanded ? "Shrink chat" : "Expand chat"}
                title={expanded ? "Shrink" : "Expand"}
              >
                {expanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">
                Hello! Welcome. I’m your AI assistant. How can I help you today?
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce mr-1" style={{ animationDelay: "0ms" }} />
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce mr-1" style={{ animationDelay: "150ms" }} />
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-lg bg-primary px-3 py-2 text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <Bot className="h-7 w-7" />
      </button>
    </>
  );
};
