"use client";

/* ═══════════════════════════════════════════════════════
   MessagesWidget — Latest family messages

   Displays the most recent family messages from the
   household message wall.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  type: string;
  isPublic: boolean;
  createdAt: string;
  sender?: { name: string; email: string } | null;
}

interface MessagesWidgetProps {
  displayToken: string;
}

export function MessagesWidget({ displayToken }: MessagesWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/${displayToken}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages.slice(0, 5));
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [displayToken]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 120_000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
          Messages Famille
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-slate-600">
          <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">Aucun message</p>
          <p className="text-xs text-slate-700 mt-1">
            Les messages partagés apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`px-3 py-2.5 rounded-xl min-h-[44px] ${
                msg.type === "alert"
                  ? "bg-amber-400/5 border border-amber-400/10"
                  : "bg-white/[0.02] border border-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-500" />
                  <span className="text-xs font-medium text-slate-300">
                    {msg.sender?.name || "Anonyme"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-600">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {msg.content}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
