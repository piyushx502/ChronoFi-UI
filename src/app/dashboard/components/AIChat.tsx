"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

    try {
      await fetchEventSource(`/api/chat?message=${encodeURIComponent(userMsg)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "text/event-stream",
        },
        onmessage(ev) {
          if (ev.event === "token") {
            setMessages(prev => 
              prev.map(m => m.id === aiMessageId ? { ...m, content: m.content + ev.data } : m)
            );
          } else if (ev.event === "tool_call") {
            // The AI decided to run the math model! 
            // In a real app we might parse this, but our backend formats the token stream to include the result anyway.
            // But if we want to extract the JSON for the chart:
            try {
              const data = JSON.parse(ev.data);
              onForecastUpdate(data);
            } catch {
              // Ignore parse errors from raw text
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
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-4 pr-12 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
