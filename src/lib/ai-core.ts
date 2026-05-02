/* ═══════════════════════════════════════════════════════════════
   MAELLIS — AI Brain Service (Concierge vocale intelligente)

   Architecture hybride :
     • STT  → Deepgram Nova-2 (évite les coûts audio Gemini)
     • LLM  → Gemini 2.0 Flash-Lite ($0.08/$0.30 par 1M tokens)
     • TTS  → Routeur intelligent : ElevenLabs (émotionnel) / Web Speech (fonctionnel)

   Toutes les clés API proviennent de la table ApiConfig (chiffrées AES-256-GCM).
   ═══════════════════════════════════════════════════════════════ */

import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/aes-crypto";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export interface GuestPreferences {
  temperature: string;
  pillowType: string;
  dietaryRestrictions: string[];
  musicGenre: string;
  knownInterests: string[];
}

export interface StayContext {
  checkInDate: string;
  checkOutDate?: string;
  stayDayNumber: number;
  propertyName: string;
  lastCheckScore?: number;
  pendingIssues?: string[];
}

export interface MaellisBrainConfig {
  householdId: string;
  language: string; // "fr-FR", "en-US", etc.
  guestName?: string;
  guestProfile?: GuestPreferences;
  stayContext?: StayContext;
}

export interface TTSResult {
  audioUrl?: string; // ElevenLabs URL
  text: string; // fallback for Web Speech API
  engine: "elevenlabs" | "web-speech";
  emotion: "neutral" | "warm" | "urgent" | "apologetic" | "enthusiastic";
}

export interface BrainResponse {
  text: string;
  tts: TTSResult;
  sentiment: "positive" | "neutral" | "negative" | "critical";
  confidence: number;
  intent?: string;
  needsAttention: boolean;
}

export interface ServiceItem {
  name: string;
  description: string;
  price?: number;
  duration?: string;
}

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const GEMINI_MODEL = "gemini-2.0-flash-lite";
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const DEEPGRAM_MODEL = "nova-2";
const DEEPGRAM_BASE_URL = `https://api.deepgram.com/v1/listen`;

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

/** Default voice ID for ElevenLabs — warm, professional, multilingual */
const DEFAULT_ELEVENLABS_VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // "Adam"

const PREMIUM_EMOTIONS: readonly TTSResult["emotion"][] = [
  "urgent",
  "apologetic",
  "warm",
  "enthusiastic",
] as const;

const NEGATIVE_SENTIMENTS: readonly BrainResponse["sentiment"][] = [
  "negative",
  "critical",
] as const;

const VALID_SENTIMENTS: readonly BrainResponse["sentiment"][] = [
  "positive",
  "neutral",
  "negative",
  "critical",
] as const;

const VALID_EMOTIONS: readonly TTSResult["emotion"][] = [
  "neutral",
  "warm",
  "urgent",
  "apologetic",
  "enthusiastic",
] as const;

/** Maximum retry attempts for external API calls */
const MAX_RETRIES = 2;

/* ═══════════════════════════════════════════════════════════════
   Structured Logger (avoids console.log en production)
   ═══════════════════════════════════════════════════════════════ */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: unknown;
}

function structuredLog(
  level: LogLevel,
  service: string,
  message: string,
  data?: unknown
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...(data !== undefined && { data }),
  };

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(JSON.stringify(entry));
      }
      break;
    default:
      console.info(JSON.stringify(entry));
      break;
  }
}

/* ═══════════════════════════════════════════════════════════════
   MaellisBrain — Classe principale
   ═══════════════════════════════════════════════════════════════ */

export class MaellisBrain {
  private config: MaellisBrainConfig;

  constructor(config: MaellisBrainConfig) {
    this.config = config;
  }

  /* ───────────────────────────────────────────────────────────
     API Key Management — Tous les secrets viennent d'ApiConfig
     ─────────────────────────────────────────────────────────── */

  /**
   * Retrieve and decrypt an API key from the ApiConfig table.
   * Follows the same pattern as gemini-analysis.ts.
   */
  private async getApiKey(serviceKey: string): Promise<string | null> {
    try {
      const config = await db.apiConfig.findUnique({
        where: { serviceKey },
      });

      if (!config || !config.isActive) {
        structuredLog("warn", "MaellisBrain", `API not configured or inactive: ${serviceKey}`);
        return null;
      }

      return decryptSecret(config.apiKey);
    } catch (error) {
      structuredLog("error", "MaellisBrain", `Error reading ApiConfig for ${serviceKey}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /* ───────────────────────────────────────────────────────────
     STT — Deepgram Nova-2
     ─────────────────────────────────────────────────────────── */

  /**
   * Transcribe an audio buffer using Deepgram Nova-2.
   * Auto-detects language and returns confidence score.
   */
  async transcribe(
    audioBuffer: ArrayBuffer
  ): Promise<{ text: string; language: string; confidence: number }> {
    const emptyResult = { text: "", language: "", confidence: 0 };

    const apiKey = await this.getApiKey("DEEPGRAM");
    if (!apiKey) {
      structuredLog("warn", "MaellisBrain", "Deepgram not configured — returning empty transcription");
      return emptyResult;
    }

    const params = new URLSearchParams({
      model: DEEPGRAM_MODEL,
      punctuate: "true",
      detect_language: "true",
      smart_format: "true",
      language: this.config.language.split("-")[0], // "fr" or "en" as hint
    });

    const url = `${DEEPGRAM_BASE_URL}?${params.toString()}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "audio/webm", // WebM is the default format from browser MediaRecorder
          },
          body: audioBuffer,
        });

        if (response.status === 429 && attempt < MAX_RETRIES) {
          const waitMs = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text().catch(() => null);
          structuredLog("error", "MaellisBrain", `Deepgram API error (attempt ${attempt + 1})`, {
            status: response.status,
            body: errorBody,
          });
          if (attempt < MAX_RETRIES) continue;
          return emptyResult;
        }

        const data = await response.json();

        const transcript = data?.results?.channels?.[0]?.alternatives?.[0];
        if (!transcript?.transcript) {
          structuredLog("warn", "MaellisBrain", "Deepgram returned empty transcription");
          return emptyResult;
        }

        const detectedLanguage = this.mapDeepgramLanguage(
          transcript.language ?? data?.results?.channels?.[0]?.detected_language ?? ""
        );

        return {
          text: transcript.transcript.trim(),
          language: detectedLanguage,
          confidence: transcript.confidence ?? 0,
        };
      } catch (error) {
        structuredLog("error", "MaellisBrain", `Deepgram network error (attempt ${attempt + 1})`, {
          error: error instanceof Error ? error.message : String(error),
        });
        if (attempt < MAX_RETRIES) continue;
        return emptyResult;
      }
    }

    return emptyResult;
  }

  /**
   * Map Deepgram language codes to our standard format.
   * Deepgram returns codes like "fr", "en", "es", "de".
   * We normalize to "fr-FR", "en-US", etc.
   */
  private mapDeepgramLanguage(code: string): string {
    if (!code) return this.config.language;

    const normalizedCode = code.split("-")[0].toLowerCase();
    const regionMap: Record<string, string> = {
      fr: "fr-FR",
      en: "en-US",
      es: "es-ES",
      de: "de-DE",
      it: "it-IT",
      pt: "pt-BR",
      nl: "nl-NL",
      ja: "ja-JP",
      ko: "ko-KR",
      zh: "zh-CN",
      ar: "ar-SA",
      hi: "hi-IN",
      ru: "ru-RU",
    };

    return regionMap[normalizedCode] ?? `${normalizedCode}-${normalizedCode.toUpperCase()}`;
  }

  /* ───────────────────────────────────────────────────────────
     LLM — Gemini 2.0 Flash-Lite
     ─────────────────────────────────────────────────────────── */

  /**
   * Core method: process text input and produce a BrainResponse.
   * Builds context-aware prompt → calls Gemini → parses response → routes TTS.
   */
  async processInput(text: string, language?: string): Promise<BrainResponse> {
    const lang = language ?? this.config.language;

    // Build context-aware system prompt
    const systemPrompt = this.buildContextPrompt(this.config);

    const userMessage = lang.startsWith("fr")
      ? `L'invité dit : "${text}"\n\nRéponds de manière concise et naturelle. Adapte ton ton au sentiment détecté.`
      : `The guest says: "${text}"\n\nRespond concisely and naturally. Adapt your tone to the detected sentiment.`;

    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

    const rawResponse = await this.callGemini(fullPrompt);
    if (!rawResponse) {
      // Fallback response when Gemini is unavailable
      const fallbackResponse = lang.startsWith("fr")
        ? "Je suis désolé, je ne peux pas répondre pour le moment. Notre équipe a été informée."
        : "I'm sorry, I cannot respond right now. Our team has been notified.";

      const fallbackEmotion = this.detectEmotion(text);
      const fallbackSentiment = this.detectSentiment(text);
      const tts = await this.generateTTS(fallbackResponse, fallbackEmotion);

      return {
        text: fallbackResponse,
        tts,
        sentiment: fallbackSentiment,
        confidence: 0.1,
        intent: "unknown",
        needsAttention: true,
      };
    }

    // Parse the structured response from Gemini
    return this.parseGeminiBrainResponse(rawResponse, text, lang);
  }

  /**
   * Call Gemini API with retry logic and exponential backoff.
   * Follows the exact same pattern as gemini-analysis.ts.
   */
  private async callGemini(prompt: string, maxRetries = MAX_RETRIES): Promise<string | null> {
    const apiKey = await this.getApiKey("GEMINI");
    if (!apiKey) {
      structuredLog("error", "MaellisBrain", "Gemini API key not configured");
      return null;
    }

    const url = `${GEMINI_BASE_URL}?key=${apiKey}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1024,
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.status === 429 && attempt < maxRetries) {
          const waitMs = Math.pow(2, attempt) * 1000;
          structuredLog("warn", "MaellisBrain", `Gemini rate limited — retrying in ${waitMs}ms`, {
            attempt: attempt + 1,
          });
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          structuredLog("error", "MaellisBrain", `Gemini API error (attempt ${attempt + 1})`, {
            status: response.status,
            data: errorData,
          });
          if (attempt < maxRetries) continue;
          return null;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          structuredLog("error", "MaellisBrain", "Gemini returned empty response");
          return null;
        }

        return text;
      } catch (error) {
        structuredLog("error", "MaellisBrain", `Gemini network error (attempt ${attempt + 1})`, {
          error: error instanceof Error ? error.message : String(error),
        });
        if (attempt < maxRetries) continue;
        return null;
      }
    }

    return null;
  }

  /**
   * Parse Gemini's structured JSON response into a BrainResponse.
   */
  private async parseGeminiBrainResponse(
    raw: string,
    originalInput: string,
    language: string
  ): Promise<BrainResponse> {
    let parsed: {
      response?: string;
      sentiment?: string;
      emotion?: string;
      confidence?: number;
      intent?: string;
    };

    try {
      // Clean response — remove markdown code fences
      const cleaned = raw
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      structuredLog("warn", "MaellisBrain", "Failed to parse Gemini response as JSON — using raw text", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });

      // Fallback: use the raw text as the response
      const emotion = this.detectEmotion(raw);
      const sentiment = this.detectSentiment(raw);
      const tts = await this.generateTTS(raw, emotion);

      return {
        text: raw,
        tts,
        sentiment,
        confidence: 0.5,
        needsAttention: NEGATIVE_SENTIMENTS.includes(sentiment),
      };
    }

    const responseText = parsed.response ?? raw;
    const sentiment = this.validateSentiment(parsed.sentiment);
    const emotion = this.validateEmotion(parsed.emotion ?? this.detectEmotion(responseText));
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) ?? 0.5));
    const intent = parsed.intent ?? this.detectIntent(originalInput, language);

    // Generate TTS based on detected emotion
    const tts = await this.generateTTS(responseText, emotion);

    return {
      text: responseText,
      tts,
      sentiment,
      confidence,
      intent,
      needsAttention:
        NEGATIVE_SENTIMENTS.includes(sentiment) || PREMIUM_EMOTIONS.includes(emotion),
    };
  }

  /* ───────────────────────────────────────────────────────────
     TTS — Intelligent Router (ElevenLabs / Web Speech API)
     ─────────────────────────────────────────────────────────── */

  /**
   * Route TTS generation: premium emotions → ElevenLabs, else Web Speech API.
   */
  async generateTTS(text: string, emotion: TTSResult["emotion"]): Promise<TTSResult> {
    if (this.shouldUsePremiumTTS(emotion)) {
      try {
        const audioUrl = await this.callElevenLabs(text, emotion);
        if (audioUrl) {
          structuredLog("debug", "MaellisBrain", "Using ElevenLabs TTS", { emotion, textLength: text.length });
          return { audioUrl, text, engine: "elevenlabs", emotion };
        }
      } catch (error) {
        structuredLog("warn", "MaellisBrain", "ElevenLabs TTS failed — falling back to Web Speech API", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Default: Web Speech API (free, browser-native)
    structuredLog("debug", "MaellisBrain", "Using Web Speech API TTS", { emotion, textLength: text.length });
    return { text, engine: "web-speech", emotion };
  }

  /**
   * Call ElevenLabs TTS API to generate audio.
   * Returns a signed URL or null on failure.
   */
  private async callElevenLabs(
    text: string,
    emotion: TTSResult["emotion"]
  ): Promise<string | null> {
    const apiKey = await this.getApiKey("ELEVENLABS");
    if (!apiKey) {
      structuredLog("warn", "MaellisBrain", "ElevenLabs not configured");
      return null;
    }

    // Map emotion to ElevenLabs voice settings
    const voiceSettings = this.getElevenLabsVoiceSettings(emotion);
    const voiceId = DEFAULT_ELEVENLABS_VOICE_ID;

    const url = `${ELEVENLABS_TTS_URL}/${voiceId}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: voiceSettings,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => null);
        structuredLog("error", "MaellisBrain", "ElevenLabs API error", {
          status: response.status,
          body: errorBody,
        });
        return null;
      }

      // Return a blob URL — the caller can convert to object URL on client side
      // For server-side, we return a base64 data URI
      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");
      return `data:audio/mpeg;base64,${base64Audio}`;
    } catch (error) {
      structuredLog("error", "MaellisBrain", "ElevenLabs network error", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Map emotion labels to ElevenLabs voice_settings.
   * Adjusts stability and similarity_boost for emotional range.
   */
  private getElevenLabsVoiceSettings(
    emotion: TTSResult["emotion"]
  ): { stability: number; similarity_boost: number; style: number } {
    switch (emotion) {
      case "urgent":
        return { stability: 0.2, similarity_boost: 0.75, style: 0.9 };
      case "apologetic":
        return { stability: 0.4, similarity_boost: 0.8, style: 0.6 };
      case "warm":
        return { stability: 0.5, similarity_boost: 0.85, style: 0.4 };
      case "enthusiastic":
        return { stability: 0.3, similarity_boost: 0.75, style: 0.8 };
      case "neutral":
      default:
        return { stability: 0.6, similarity_boost: 0.85, style: 0.1 };
    }
  }

  /* ───────────────────────────────────────────────────────────
     Script Generators (Upsell / Late Checkout)
     ─────────────────────────────────────────────────────────── */

  /**
   * Generate a personalized upsell script via Gemini.
   * Present available services conversationally based on guest profile.
   */
  async generateUpsellScript(
    guestName: string,
    propertyName: string,
    services: ServiceItem[],
    language: string
  ): Promise<string> {
    const servicesText = services
      .map((s) => {
        const parts = [`- ${s.name}: ${s.description}`];
        if (s.price != null) parts.push(`(${s.price}€)`);
        if (s.duration) parts.push(`— ${s.duration}`);
        return parts.join(" ");
      })
      .join("\n");

    const isFrench = language.startsWith("fr");

    const prompt = isFrench
      ? `Tu es un concierge d'hôtel de luxe. Tu dois proposer des services supplémentaires à un invité de manière naturelle et non intrusive.

Invité : ${guestName}
Propriété : ${propertyName}
Services disponibles :
${servicesText}

Règles :
- Sois chaleureux et discret, jamais commercial
- Ne propose que 2 services maximum par message
- Adapte au contexte : fin de journée = bien-être, matin = activités
- Si l'invité semble pressé, sois très bref
- Réponds en français, maximum 3 phrases

Génère uniquement le texte du script, sans JSON ni markdown.`
      : `You are a luxury hotel concierge. You must suggest additional services to a guest in a natural, non-intrusive way.

Guest: ${guestName}
Property: ${propertyName}
Available services:
${servicesText}

Rules:
- Be warm and discreet, never salesy
- Suggest at most 2 services per message
- Adapt to context: end of day = wellness, morning = activities
- If the guest seems rushed, be very brief
- Respond in English, maximum 3 sentences

Generate only the script text, no JSON or markdown.`;

    const raw = await this.callGeminiWithPlainText(prompt);
    return this.cleanRawText(raw ?? (isFrench ? "Je suis à votre disposition si vous avez besoin de quoi que ce soit." : "I'm at your service if you need anything."));
  }

  /**
   * Generate a late checkout offer script via Gemini.
   * Persuasive but respectful tone, with clear pricing.
   */
  async generateLateCheckoutScript(
    guestName: string,
    price: number,
    newTime: string,
    language: string
  ): Promise<string> {
    const isFrench = language.startsWith("fr");

    const prompt = isFrench
      ? `Tu es un concierge d'hôtel de luxe. Tu proposes un départ tardif à un invité.

Invité : ${guestName}
Nouveau créneau de départ : ${newTime}
Prix supplémentaire : ${price}€

Règles :
- Sois chaleureux et respectueux, jamais pressant
- Mentionne le prix naturellement, sans en faire un obstacle
- Rappelle le bénéfice pour l'invité (détente, pas de précipitation)
- Maximum 3 phrases
- Réponds en français

Génère uniquement le texte du script, sans JSON ni markdown.`
      : `You are a luxury hotel concierge. You're offering a late checkout to a guest.

Guest: ${guestName}
New checkout time: ${newTime}
Additional price: ${price}€

Rules:
- Be warm and respectful, never pushy
- Mention the price naturally, not as an obstacle
- Remind the guest of the benefit (relax, no rush)
- Maximum 3 sentences
- Respond in English

Generate only the script text, no JSON or markdown.`;

    const raw = await this.callGeminiWithPlainText(prompt);
    return this.cleanRawText(
      raw ?? (isFrench
        ? `Bonjour ${guestName}, je voulais vous informer que nous avons la possibilité de prolonger votre départ jusqu'à ${newTime} pour ${price}€ supplémentaires. Cela vous permettrait de profiter davantage de votre journée.`
        : `Hello ${guestName}, I wanted to let you know that we can extend your checkout until ${newTime} for an additional ${price}€. This would allow you to enjoy more of your day.`)
    );
  }

  /**
   * Call Gemini with plain text output (no JSON mode).
   * Used for script generation where we want natural language.
   */
  private async callGeminiWithPlainText(prompt: string): Promise<string | null> {
    const apiKey = await this.getApiKey("GEMINI");
    if (!apiKey) {
      structuredLog("error", "MaellisBrain", "Gemini API key not configured");
      return null;
    }

    const url = `${GEMINI_BASE_URL}?key=${apiKey}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512,
              // No responseMimeType — plain text output
            },
          }),
        });

        if (response.status === 429 && attempt < MAX_RETRIES) {
          const waitMs = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          structuredLog("error", "MaellisBrain", `Gemini API error (attempt ${attempt + 1})`, {
            status: response.status,
            data: errorData,
          });
          if (attempt < MAX_RETRIES) continue;
          return null;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          structuredLog("error", "MaellisBrain", "Gemini returned empty response");
          return null;
        }

        return text;
      } catch (error) {
        structuredLog("error", "MaellisBrain", `Gemini network error (attempt ${attempt + 1})`, {
          error: error instanceof Error ? error.message : String(error),
        });
        if (attempt < MAX_RETRIES) continue;
        return null;
      }
    }

    return null;
  }

  /* ───────────────────────────────────────────────────────────
     Context & Prompt Building
     ─────────────────────────────────────────────────────────── */

  /**
   * Build the system prompt with guest memory, stay context, and instructions.
   * This is the brain's "personality" — contextual, warm, professional.
   */
  buildContextPrompt(config: MaellisBrainConfig): string {
    const isFrench = config.language.startsWith("fr");
    const guestName = config.guestName ?? (isFrench ? "l'invité" : "the guest");

    // --- Guest Profile Section ---
    const profile = config.guestProfile;
    let profileSection = "";
    if (profile) {
      const prefs: string[] = [];
      if (profile.temperature) prefs.push(isFrench ? `Température préférée : ${profile.temperature}` : `Preferred temperature: ${profile.temperature}`);
      if (profile.pillowType) prefs.push(isFrench ? `Oreiller : ${profile.pillowType}` : `Pillow: ${profile.pillowType}`);
      if (profile.dietaryRestrictions?.length) prefs.push(isFrench ? `Restrictions alimentaires : ${profile.dietaryRestrictions.join(", ")}` : `Dietary restrictions: ${profile.dietaryRestrictions.join(", ")}`);
      if (profile.musicGenre) prefs.push(isFrench ? `Musique : ${profile.musicGenre}` : `Music: ${profile.musicGenre}`);
      if (profile.knownInterests?.length) prefs.push(isFrench ? `Centres d'intérêt : ${profile.knownInterests.join(", ")}` : `Interests: ${profile.knownInterests.join(", ")}`);
      profileSection = prefs.join("\n");
    }

    // --- Stay Context Section ---
    const stay = config.stayContext;
    let staySection = "";
    if (stay) {
      const lines: string[] = [];
      lines.push(isFrench ? `Propriété : ${stay.propertyName}` : `Property: ${stay.propertyName}`);
      lines.push(isFrench ? `Jour du séjour : ${stay.stayDayNumber}` : `Stay day: ${stay.stayDayNumber}`);
      if (stay.lastCheckScore != null) {
        lines.push(isFrench ? `Dernier score de satisfaction : ${stay.lastCheckScore}/5` : `Last satisfaction score: ${stay.lastCheckScore}/5`);
      }
      if (stay.pendingIssues?.length) {
        lines.push(isFrench ? `Problèmes en cours : ${stay.pendingIssues.join("; ")}` : `Pending issues: ${stay.pendingIssues.join("; ")}`);
      }
      if (stay.checkInDate) {
        lines.push(isFrench ? `Arrivée : ${stay.checkInDate}` : `Check-in: ${stay.checkInDate}`);
      }
      if (stay.checkOutDate) {
        lines.push(isFrench ? `Départ : ${stay.checkOutDate}` : `Check-out: ${stay.checkOutDate}`);
      }
      staySection = lines.join("\n");
    }

    // --- Assemble the full prompt ---
    if (isFrench) {
      return `Tu es Maellis, le concierge intelligent de la propriété. Tu es chaleureux, professionnel et discret.

## Profil de l'invité
Nom : ${guestName}
${profileSection ? `\n${profileSection}\n` : ""}
## Contexte du séjour
${staySection ?? "Aucun contexte de séjour disponible."}

## Consignes
- Réponds en français, de manière concise (2-4 phrases maximum)
- Sois proactif si tu détectes un problème (score < 4, problèmes en cours)
- Adapte ton ton : chaleureux pour les compliments, empathique pour les plaintes, urgent pour les problèmes critiques
- Utilise le prénom de l'invité naturellement
- Ne propose jamais de service non disponible
- Si tu ne sais pas, propose de contacter l'hôte directement

## Format de réponse (JSON strict)
{
  "response": "<ta réponse en français>",
  "sentiment": "<positive|neutral|negative|critical>",
  "emotion": "<neutral|warm|urgent|apologetic|enthusiastic>",
  "confidence": <0.0-1.0>,
  "intent": "<catégorie de l'intention détectée>"
}

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte supplémentaire.`;
    }

    return `You are Maellis, the smart concierge of the property. You are warm, professional, and discreet.

## Guest Profile
Name: ${guestName}
${profileSection ? `\n${profileSection}\n` : ""}
## Stay Context
${staySection ?? "No stay context available."}

## Instructions
- Respond in English, concisely (2-4 sentences maximum)
- Be proactive if you detect a problem (score < 4, pending issues)
- Adapt your tone: warm for compliments, empathetic for complaints, urgent for critical issues
- Use the guest's name naturally
- Never suggest unavailable services
- If you don't know, suggest contacting the host directly

## Response format (strict JSON)
{
  "response": "<your response in English>",
  "sentiment": "<positive|neutral|negative|critical>",
  "emotion": "<neutral|warm|urgent|apologetic|enthusiastic>",
  "confidence": <0.0-1.0>,
  "intent": "<detected intent category>"
}

Respond ONLY with a valid JSON object, no markdown or additional text.`;
  }

  /* ───────────────────────────────────────────────────────────
     Emotion & Sentiment Detection
     ─────────────────────────────────────────────────────────── */

  /**
   * Simple keyword-based emotion detection.
   * Used as fallback when Gemini doesn't return structured emotion data.
   */
  detectEmotion(text: string): TTSResult["emotion"] {
    const lower = text.toLowerCase();

    // Urgency indicators (highest priority)
    const urgentKeywords = [
      "urgent", "urgence", "immédiat", "immédiatement", "maintenant", "now",
      "emergency", "help", "au secours", "danger", "feu", "fire",
      "fuite d'eau", "water leak", "cassé", "broken", "panne", "outage",
      "bloqué", "locked out", "clé", "key", "pas d'accès",
    ];
    if (urgentKeywords.some((kw) => lower.includes(kw))) {
      return "urgent";
    }

    // Apologetic indicators
    const apologeticKeywords = [
      "désolé", "pardon", "excuse", "regret", "sorry", "apologies",
      "mauvais", "terrible", "horrible", "inacceptable", "unacceptable",
      "déçu", "disappointed", "insatisfait", "unsatisfied",
      "n'est pas normal", "pas correct", "not right",
    ];
    if (apologeticKeywords.some((kw) => lower.includes(kw))) {
      return "apologetic";
    }

    // Enthusiastic indicators
    const enthusiasticKeywords = [
      "super", "excellent", "parfait", "magnifique", "génial",
      "merci beaucoup", "thank you so much", "wonderful", "amazing",
      "fantastic", "adoré", "loved", "incroyable", "incredible",
      "best", "meilleur", "recommand", "recommend",
    ];
    if (enthusiasticKeywords.some((kw) => lower.includes(kw))) {
      return "enthusiastic";
    }

    // Warm indicators
    const warmKeywords = [
      "merci", "thank", "bien", "good", "confortable", "comfortable",
      "agréable", "pleasant", "tranquille", "quiet", "calme", "peaceful",
      "bonne nuit", "good night", "bonne journée", "good day",
      "aime", "like", "apprécie", "appreciate",
    ];
    if (warmKeywords.some((kw) => lower.includes(kw))) {
      return "warm";
    }

    return "neutral";
  }

  /**
   * Simple keyword-based sentiment detection.
   */
  private detectSentiment(text: string): BrainResponse["sentiment"] {
    const lower = text.toLowerCase();
    const emotion = this.detectEmotion(text);

    // Critical: strong negative signals
    const criticalKeywords = [
      "danger", "sécurité", "safety", "feu", "fire", "vol", "theft",
      "agression", "assault", "menace", "threat", "police", "ambulance",
      "hospital", "hôpital", "blessé", "injured",
    ];
    if (criticalKeywords.some((kw) => lower.includes(kw))) {
      return "critical";
    }

    // Negative: complaint signals
    if (emotion === "apologetic" || emotion === "urgent") {
      // Check if it's truly negative vs. just urgent/apologetic request
      const negativeKeywords = [
        "problème", "problem", "ne marche pas", "doesn't work", "cassé", "broken",
        "sale", "dirty", "bruit", "noise", "mauvais", "bad",
        "déçu", "disappointed", "insatisfait", "unsatisfied",
      ];
      if (negativeKeywords.some((kw) => lower.includes(kw))) {
        return "negative";
      }
    }

    // Positive: enthusiastic signals
    if (emotion === "enthusiastic") {
      return "positive";
    }

    return "neutral";
  }

  /**
   * Simple intent detection based on keywords.
   */
  private detectIntent(text: string, language: string): string {
    const lower = text.toLowerCase();

    const intentMap: Array<[string[], string]> = [
      // Environmental controls
      [["température", "clim", "chauff", "chaud", "froid", "thermostat", "temperature", "ac", "heating"], "climate_control"],
      [["lumière", "éclairage", "light", "lampe", "allume", "éteins"], "lighting"],
      [["musique", "son", "volume", "music", "speaker", "radio"], "music"],
      [["volet", "store", "rideau", "blind", "curtain", "shutter"], "blinds"],
      // Services
      [["service", "réception", "ménage", "cleaning", "housekeeping"], "service_request"],
      [["restaurant", "repas", "manger", "restaurant", "food", "dinner", "breakfast"], "dining"],
      [["taxi", "transport", "uber", "navette", "shuttle", "airport"], "transportation"],
      [["excursion", "activité", "visite", "tour", "activity", "outing"], "activity_booking"],
      // Complaints
      [["problème", "plainte", "complaint", "pas marche", "cassé", "broken"], "complaint"],
      // Information
      [["wifi", "internet", "code", "password", "mot de passe"], "wifi_info"],
      [["check-out", "départ", "checkout", "leave"], "checkout"],
      [["heure", "heure", "quelle heure", "what time"], "time_info"],
      // General
      [["merci", "thank", "super", "parfait", "great"], "gratitude"],
      [["bonjour", "bonsoir", "hello", "hi", "salut"], "greeting"],
      [["au revoir", "bye", "goodbye"], "farewell"],
    ];

    for (const [keywords, intent] of intentMap) {
      if (keywords.some((kw) => lower.includes(kw))) {
        return intent;
      }
    }

    return "general";
  }

  /* ───────────────────────────────────────────────────────────
     TTS Routing Logic
     ─────────────────────────────────────────────────────────── */

  /**
   * Determine whether premium TTS (ElevenLabs) should be used.
   * Premium = emotional/critical responses that benefit from human-like voice.
   */
  shouldUsePremiumTTS(emotion: string, sentiment?: string): boolean {
    const emotionMatches = (PREMIUM_EMOTIONS as readonly string[]).includes(emotion);

    if (emotionMatches) return true;

    const sentimentMatches = sentiment != null && (NEGATIVE_SENTIMENTS as readonly string[]).includes(sentiment);
    return sentimentMatches;
  }

  /* ───────────────────────────────────────────────────────────
     Validation Helpers
     ─────────────────────────────────────────────────────────── */

  private validateSentiment(value: unknown): BrainResponse["sentiment"] {
    if (typeof value === "string" && (VALID_SENTIMENTS as readonly string[]).includes(value)) {
      return value as BrainResponse["sentiment"];
    }
    return "neutral";
  }

  private validateEmotion(value: unknown): TTSResult["emotion"] {
    if (typeof value === "string" && (VALID_EMOTIONS as readonly string[]).includes(value)) {
      return value as TTSResult["emotion"];
    }
    return "neutral";
  }

  /**
   * Clean raw text from Gemini: remove markdown, trim whitespace.
   */
  private cleanRawText(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/^["']|["']$/g, "")    // Remove surrounding quotes
      .replace(/^[*#_\s]+|[ *_#\s]+$/gm, "") // Remove markdown formatting
      .trim();
  }
}
