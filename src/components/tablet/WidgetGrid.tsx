"use client";

/* ═══════════════════════════════════════════════════════
   WidgetGrid — Dynamic tablet widget renderer

   Renders enabled widgets in order based on their configuration.
   Each widget receives the appropriate props based on type.
   Responsive grid layout for tablet display.
   ═══════════════════════════════════════════════════════ */

import { AnimatePresence, motion } from "framer-motion";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import EmergencyButton from "@/components/tablet/EmergencyButton";
import SafeArrivalWidget from "@/components/tablet/SafeArrivalWidget";
import { ContextualWidget } from "@/components/tablet/ContextualWidget";
import { ClockWidget } from "./widgets/ClockWidget";
import { WeatherWidget } from "./widgets/WeatherWidget";
import { CalendarWidget } from "./widgets/CalendarWidget";
import { FamilyStatusWidget } from "./widgets/FamilyStatusWidget";
import { NewsWidget } from "./widgets/NewsWidget";
import { QuickActionsWidget } from "./widgets/QuickActionsWidget";
import { VoiceWidget } from "./widgets/VoiceWidget";
import { MessagesWidget } from "./widgets/MessagesWidget";
import type { WidgetConfig } from "@/lib/widget-types";

interface WidgetGridProps {
  widgets: WidgetConfig[];
  displayToken: string;
  householdName?: string;
  weather?: {
    temp: number;
    code: number;
    desc: string;
    emoji: string;
  } | null;
  news?: { title: string; source: string; link?: string }[];
  online: boolean;
  onRefresh?: () => void;
  voiceHook?: ReturnType<typeof useVoiceCommand>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

export function WidgetGrid({
  widgets,
  displayToken,
  householdName,
  weather,
  news,
  online,
  onRefresh,
  voiceHook,
}: WidgetGridProps) {
  const enabledWidgets = widgets
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <AnimatePresence mode="wait">
        {enabledWidgets.map((widget) => (
          <WidgetRenderer
            key={widget.id}
            config={widget}
            displayToken={displayToken}
            householdName={householdName}
            weather={weather}
            news={news}
            online={online}
            onRefresh={onRefresh}
            voiceHook={voiceHook}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Individual Widget Renderer ─── */

interface WidgetRendererProps {
  config: WidgetConfig;
  displayToken: string;
  householdName?: string;
  weather?: {
    temp: number;
    code: number;
    desc: string;
    emoji: string;
  } | null;
  news?: { title: string; source: string; link?: string }[];
  online: boolean;
  onRefresh?: () => void;
  voiceHook?: ReturnType<typeof useVoiceCommand>;
}

function WidgetRenderer({
  config,
  displayToken,
  householdName,
  weather,
  news,
  online,
  onRefresh,
}: WidgetRendererProps) {
  switch (config.type) {
    case "clock":
      return (
        <ClockWidget
          householdName={householdName}
          weather={weather}
          online={online}
          onRefresh={onRefresh}
        />
      );

    case "weather":
      return <WeatherWidget weather={weather} />;

    case "calendar":
      return <CalendarWidget displayToken={displayToken} />;

    case "family-status":
      return <FamilyStatusWidget displayToken={displayToken} />;

    case "safe-arrival":
      return (
        <SafeArrivalWidget
          displayToken={displayToken}
          householdName={householdName}
        />
      );

    case "news":
      return <NewsWidget initialNews={news} />;

    case "quick-actions":
      return <QuickActionsWidget weather={weather} news={news} />;

    case "voice":
      return <VoiceWidget />;

    case "messages":
      return <MessagesWidget displayToken={displayToken} />;

    case "emergency":
      return (
        <EmergencyButton
          hostWhatsapp={null}
          householdName={householdName || "Maison"}
        />
      );

    case "contextual":
      return <ContextualWidget displayToken={displayToken} />;

    default:
      return null;
  }
}
