"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot } from "lucide-react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { motion, AnimatePresence } from "framer-motion";

interface AIChatProps {
  onForecastUpdate: (data: unknown) => void;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

export default function AIChat({ onForecastUpdate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "ai", content: "Hello. I am the ChronoFi quant agent. Tell me your financial goal, and I will run the probabilistic LSTM forecast." }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore threadId from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("chronofi_thread_id");
    if (saved) {
      setThreadId(saved);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewConversation = () => {
    setThreadId(null);
    localStorage.removeItem("chronofi_thread_id");
    setMessages([
      { id: Date.now().toString(), role: "ai", content: "Started a new conversation thread. How can I assist your financial planning today?" }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = input;
    setInput("");
    
    const newMessages = [...messages, { id: Date.now().toString(), role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setIsStreaming(true);

    // Create an empty AI message to stream into
    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, role: "ai", content: "" }]);

    const token = localStorage.getItem("token");
    const threadParam = threadId ? `&thread_id=${encodeURIComponent(threadId)}` : "";

    try {
      await fetchEventSource(`/api/chat?message=${encodeURIComponent(userMsg)}${threadParam}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "text/event-stream",
        },
        onmessage(ev) {
          if (!ev.data || ev.data === "[DONE]") return;
          try {
            const parsed = JSON.parse(ev.data);
            if (parsed.type === "thread_id" && parsed.thread_id) {
              setThreadId(parsed.thread_id);
              localStorage.setItem("chronofi_thread_id", parsed.thread_id);
            } else if (parsed.type === "token" && parsed.content) {
              setMessages(prev => 
                prev.map(m => m.id === aiMessageId ? { ...m, content: m.content + parsed.content } : m)
              );
            } else if (parsed.type === "scenario_result" && parsed.data) {
              onForecastUpdate(parsed.data);
            } else if (parsed.type === "liability_confirmed" && parsed.data) {
              onForecastUpdate(parsed.data);
            } else if (parsed.type === "error" && parsed.content) {
              setMessages(prev => 
                prev.map(m => m.id === aiMessageId ? { ...m, content: m.content + `\n[Error: ${parsed.content}]` } : m)
              );
            }
          } catch {
            // Fallback for non-JSON tokens
            if (ev.data) {
              setMessages(prev => 
                prev.map(m => m.id === aiMessageId ? { ...m, content: m.content + ev.data } : m)
              );
            }
          }
        },
        onclose() {
          setIsStreaming(false);
        },
        onerror(err) {
          console.error("SSE Error:", err);
          setIsStreaming(false);
          throw err; // Stop retrying
        }
      });
    } catch {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/50">
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/40">
        <span className="flex items-center gap-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          {threadId ? `Thread: ${threadId.slice(0, 8)}...` : "Active Planning Session"}
        </span>
        <button
          onClick={handleNewConversation}
          type="button"
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50"
        >
          + New Thread
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700" 
                  : "bg-transparent text-zinc-300"
              }`}>
                {/* Basic markdown rendering can be added here, for now just pre-wrap */}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.role === "ai" && msg.content === "" && isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-1 align-middle" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g. Can I afford a 50 Lakh car in 5 years if I save 20k a month?"
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-4 pr-12 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors placeholder:text-zinc-600"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 p-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
