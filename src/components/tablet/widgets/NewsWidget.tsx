"use client";

/* ═══════════════════════════════════════════════════════
   NewsWidget — News ticker with auto-scroll

   Horizontal scrollable headlines with dot indicators.
   Extracted from the tablet display page.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Loader2 } from "lucide-react";

interface NewsItem {
  title: string;
  source: string;
  link?: string;
}

interface NewsWidgetProps {
  /** Pre-fetched news items (optional, if provided no internal fetch) */
  initialNews?: NewsItem[];
}

export function NewsWidget({ initialNews }: NewsWidgetProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews || []);
  const [tickerOffset, setTickerOffset] = useState(0);
  const [loading, setLoading] = useState(!initialNews);

  /* ─── Fetch news if not provided ─── */
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/enrichment?XTransformPort=3000");
      if (!res.ok) return;
      const data = await res.json();
      if (data.news?.items) {
        setNews(
          data.news.items.slice(0, 5).map(
            (item: { title: string; source?: string; link?: string }) => ({
              title: item.title,
              source: item.source || "Actualités",
              link: item.link,
            })
          )
        );
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialNews) {
      fetchNews();
      const timer = setInterval(fetchNews, 600_000);
      return () => clearInterval(timer);
    }
  }, [initialNews, fetchNews]);

  /* ─── Auto-scroll ─── */
  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setTickerOffset((prev) => {
        if (prev >= news.length - 1) return 0;
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [news.length]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
            Actualités
          </h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (news.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
          Actualités
        </h3>
      </div>

      <div className="relative overflow-hidden rounded-xl glass py-3 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tickerOffset}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs font-bold text-amber-400/70 shrink-0">
              {String(tickerOffset + 1).padStart(2, "0")}
            </span>
            <p className="text-sm text-slate-300 leading-relaxed line-clamp-1">
              {news[tickerOffset]?.title}
            </p>
            <span className="text-xs text-slate-600 shrink-0 ml-auto">
              {news[tickerOffset]?.source}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Ticker dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {news.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setTickerOffset(i)}
              className={`h-1 rounded-full transition-all duration-300 min-w-[24px] min-h-[12px] ${
                i === tickerOffset
                  ? "bg-amber-400 w-6"
                  : "bg-white/10 w-2 hover:bg-white/20"
              }`}
              aria-label={`Actualité ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
