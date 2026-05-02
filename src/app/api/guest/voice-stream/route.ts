/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Guest Voice Stream API

   POST /api/guest/voice-stream

   Pipeline audio complet pour les invités :
     1. Transcription (Deepgram → z-ai-web-dev-sdk ASR)
     2. Réponse IA (MaellisBrain → parseVoiceCommand fallback)
     3. Synthèse vocale (ElevenLabs → z-ai-web-dev-sdk TTS → texte seul)

   Public route — authentifié via token invité dans FormData.

   Rate limiting : 30 requêtes / session / heure
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { MaellisBrain } from "@/lib/ai-core";
import { parseVoiceCommand } from "@/lib/voice-command-router";
import { rateLimit } from "@/lib/rate-limit";

/* ─── Types ─── */

interface VoiceStreamSuccess {
  success: true;
  text: string;
  audioBase64?: string;
  audioMimeType?: string;
}

interface VoiceStreamError {
  success: false;
  error: string;
}

type VoiceStreamResponse = VoiceStreamSuccess | VoiceStreamError;

/* ─── Rate limiting en mémoire (par sessionId) ─── */

const sessionRateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Nettoyage toutes les 10 minutes
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of sessionRateLimitMap) {
      if (now > entry.resetAt) sessionRateLimitMap.delete(key);
    }
  }, 600_000);
}

function sessionRateLimit(
  sessionId: string,
  maxRequests = 30,
  windowMs = 3_600_000
): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = sessionRateLimitMap.get(sessionId);
  if (!entry || now > entry.resetAt) {
    sessionRateLimitMap.set(sessionId, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }
  entry.count++;
  return {
    limited: entry.count > maxRequests,
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/* ─── Réponses statiques de fallback (intent → réponse) ─── */

const FALLBACK_RESPONSES: Record<string, string> = {
  weather:
    "Je n'ai pas accès aux données météo en mode invité pour le moment. Je vous invite à regarder par la fenêtre !",
  news:
    "Je ne peux pas récupérer les actualités en mode invité. Demandez à votre hôte pour plus d'informations.",
  sport:
    "Les résultats sportifs ne sont pas disponibles en mode invité. Votre hôte pourra vous renseigner.",
  horoscope:
    "Les étoiles sont mystérieuses... Demandez à votre hôte si un horoscope est disponible dans la maison.",
  joke:
    "Que dit un WiFi quand il est triste ? Il perd la connexion ! N'hésitez pas à me poser d'autres questions.",
  quote:
    "Comme le disait Gandhi : 'Soyez le changement que vous voulez voir dans le monde.'",
  fun_fact:
    "Le saviez-vous ? La Tour Eiffel peut grandir de 15 cm en été à cause de la dilatation thermique de l'acier.",
  recipe_search:
    "Je ne peux pas chercher de recettes en mode invité. Consultez le livre de recettes dans la cuisine !",
  recipe_random:
    "Pourquoi ne pas demander à votre hôte une suggestion de recette locale ?",
  timer: "Le minuteur n'est pas disponible en mode invité. Utilisez le minuteur de votre téléphone.",
  calculate: "Je ne peux pas faire de calculs en mode invité pour le moment.",
  whatsapp:
    "Pour contacter votre hôte, utilisez le numéro WhatsApp affiché dans la maison.",
  navigate:
    "Je ne peux pas vous guider en mode invité. Utilisez Google Maps ou demandez à votre hôte.",
  reminder_set: "Les rappels ne sont pas disponibles en mode invité.",
  reminder_list: "Les rappels ne sont pas disponibles en mode invité.",
  preference_like: "Merci pour l'information ! Je la note pour votre séjour.",
  preference_dislike: "Noté, je m'en souviendrai pour votre confort.",
  help:
    "Je suis Maellis, votre assistant vocal. En mode invité, je peux répondre à vos questions sur la maison et vos services. Appuyez sur le micro pour parler !",
  greeting: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
  thank_you: "Avec plaisir ! N'hésitez pas si vous avez besoin d'autre chose.",
  goodbye: "Au revoir et bonne journée ! Profitez bien de votre séjour.",
  list_activities:
    "Les activités recommandées sont affichées sur la tablette de la maison. Demandez à votre hôte pour plus de suggestions.",
  ask_price_context: "Pour les tarifs, je vous invite à consulter le guide d'accueil ou demander à votre hôte.",
  ask_hours_context:
    "Les horaires des services sont disponibles dans le guide d'accueil de votre chambre.",
  ask_directions_context:
    "Pour les directions, utilisez Google Maps ou demandez à votre hôte qui connaît bien la région.",
  wifi_info: "Le code WiFi est affiché dans le guide d'accueil de votre chambre.",
  checkout: "Le départ est prévu à 11h. Contactez votre hôte si vous souhaitez un départ tardif.",
  time_info: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " — Bonne question !",
  name_ask: "Je suis Maellis, votre concierge intelligent dans cette maison. Comment puis-je vous aider ?",
  quiet_mode: "D'accord, je reste discret. Appuyez sur le micro quand vous aurez besoin de moi.",
  volume_up: "Le volume ne peut pas être ajusté en mode invité.",
  volume_down: "Le volume ne peut pas être ajusté en mode invité.",
};

const DEFAULT_FALLBACK =
  "Je suis désolé, je n'ai pas bien compris. Pouvez-vous reformuler votre demande ? Vous pouvez me demander des informations sur la maison, les services, ou des conseils locaux.";

/* ─── Transcription via z-ai-web-dev-sdk ASR ─── */

async function transcribeWithSDK(audioBuffer: ArrayBuffer): Promise<string> {
  try {
    // Import dynamique — z-ai-web-dev-sdk côté serveur uniquement
    const ZAI = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.default.create();

    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    const response = await zai.audio.asr.create({ file_base64: base64Audio });

    return response.text || "";
  } catch (error) {
    console.error("[GUEST-VOICE-STREAM] z-ai-web-dev-sdk ASR échoué:", error);
    return "";
  }
}

/* ─── TTS via z-ai-web-dev-sdk ─── */

async function ttsWithSDK(text: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const ZAI = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.default.create();

    const response = await zai.audio.tts.create({
      input: text,
      voice: "jam",
      speed: 1.0,
      response_format: "wav",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return {
      base64: buffer.toString("base64"),
      mimeType: "audio/wav",
    };
  } catch (error) {
    console.error("[GUEST-VOICE-STREAM] z-ai-web-dev-sdk TTS échoué:", error);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════
   POST — Pipeline vocale complète
   ═══════════════════════════════════════════════════════ */

export async function POST(request: NextRequest): Promise<NextResponse<VoiceStreamResponse>> {
  try {
    // ─── Rate limit par IP (sécurité de base) ───
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ipLimit = rateLimit(clientIp, 60, 60_000);
    if (ipLimit.limited) {
      return NextResponse.json<VoiceStreamError>(
        { success: false, error: `Trop de requêtes. Réessayez dans ${ipLimit.retryAfter}s.` },
        { status: 429 }
      );
    }

    // ─── Parsing du FormData ───
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const sessionId = formData.get("sessionId") as string | null;
    const householdId = formData.get("householdId") as string | null;

    if (!audioFile || !sessionId || !householdId) {
      return NextResponse.json<VoiceStreamError>(
        { success: false, error: "Paramètres manquants (audio, sessionId, householdId)" },
        { status: 400 }
      );
    }

    if (audioFile.size === 0) {
      return NextResponse.json<VoiceStreamError>(
        { success: false, error: "Fichier audio vide" },
        { status: 400 }
      );
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json<VoiceStreamError>(
        { success: false, error: "Fichier audio trop volumineux (max 10 Mo)" },
        { status: 400 }
      );
    }

    // ─── Validation du token invité ───
    const access = await db.guestAccess.findUnique({
      where: { id: sessionId },
    });

    if (!access || !access.isActive) {
      return NextResponse.json<VoiceStreamError>(
        { success: false, error: "Session invalide ou désactivée" },
        { status: 401 }
      );
    }

    if (access.expiresAt < new Date()) {
      return NextResponse.json<VoiceStreamError>(
        { success: false, error: "Session expirée" },
        { status: 401 }
      );
    }

    if (access.householdId !== householdId) {
      console.warn("[GUEST-VOICE-STREAM] Mismatch householdId pour session:", sessionId);
      return NextResponse.json<VoiceStreamError>(
        { success: false, error: "Session invalide" },
        { status: 401 }
      );
    }

    // ─── Rate limit par session ───
    const sessionLimit = sessionRateLimit(sessionId);
    if (sessionLimit.limited) {
      return NextResponse.json<VoiceStreamError>(
        { success: false, error: `Limite atteinte pour cette session. Réessayez dans ${sessionLimit.retryAfter}s.` },
        { status: 429 }
      );
    }

    // ─── Lecture de l'audio ───
    const audioBuffer = await audioFile.arrayBuffer();
    console.log("[GUEST-VOICE-STREAM] Audio reçu:", audioFile.name, audioFile.size, "bytes");

    /* ═══════════════════════════════════════════════
       ÉTAPE 1 : Transcription
       ═══════════════════════════════════════════════ */
    console.log("[GUEST-VOICE-STREAM] Étape 1 : Transcription...");

    let transcript = "";

    // Tentative 1 : Deepgram via MaellisBrain
    try {
      const brain = new MaellisBrain({
        householdId,
        language: "fr-FR",
        guestName: access.name,
      });

      const deepgramResult = await brain.transcribe(audioBuffer);
      if (deepgramResult.text) {
        transcript = deepgramResult.text;
        console.log("[GUEST-VOICE-STREAM] Deepgram OK:", transcript.slice(0, 80));
      }
    } catch (error) {
      console.warn("[GUEST-VOICE-STREAM] Deepgram échoué, fallback vers z-ai-web-dev-sdk");
    }

    // Tentative 2 : z-ai-web-dev-sdk ASR
    if (!transcript) {
      transcript = await transcribeWithSDK(audioBuffer);
      if (transcript) {
        console.log("[GUEST-VOICE-STREAM] z-ai-web-dev-sdk ASR OK:", transcript.slice(0, 80));
      }
    }

    if (!transcript.trim()) {
      console.log("[GUEST-VOICE-STREAM] Aucune transcription obtenue");
      return NextResponse.json<VoiceStreamSuccess>({
        success: true,
        text: "Je n'ai pas bien entendu. Réessayez en parlant plus près du micro.",
      });
    }

    /* ═══════════════════════════════════════════════
       ÉTAPE 2 : Réponse IA
       ═══════════════════════════════════════════════ */
    console.log("[GUEST-VOICE-STREAM] Étape 2 : Génération de la réponse...");

    let responseText = "";

    // Tentative 1 : MaellisBrain (Gemini)
    try {
      const brain = new MaellisBrain({
        householdId,
        language: "fr-FR",
        guestName: access.name,
      });

      const brainResponse = await brain.processInput(transcript);
      if (brainResponse.text) {
        responseText = brainResponse.text;
        console.log("[GUEST-VOICE-STREAM] MaellisBrain OK:", responseText.slice(0, 80));

        // Si MaellisBrain a produit un audio ElevenLabs (data URI)
        if (brainResponse.tts?.audioUrl?.startsWith("data:audio/")) {
          const audioData = brainResponse.tts.audioUrl.split(",")[1];
          const audioMime = brainResponse.tts.audioUrl.split(";")[0].replace("data:", "");

          return NextResponse.json<VoiceStreamSuccess>({
            success: true,
            text: responseText,
            audioBase64: audioData,
            audioMimeType: audioMime,
          });
        }
      }
    } catch (error) {
      console.warn("[GUEST-VOICE-STREAM] MaellisBrain échoué, fallback vers parseVoiceCommand");
    }

    // Tentative 2 : parseVoiceCommand + réponses statiques
    if (!responseText) {
      const command = parseVoiceCommand(transcript);
      console.log("[GUEST-VOICE-STREAM] Commande parsée:", command.intent, "confiance:", command.confidence);

      responseText = FALLBACK_RESPONSES[command.intent] || DEFAULT_FALLBACK;

      // Personnaliser avec le nom de l'invité si c'est un salutation
      if (command.intent === "greeting" && access.name) {
        responseText = `Bonjour ${access.name} ! Comment puis-je vous aider ?`;
      }
      if (command.intent === "goodbye" && access.name) {
        responseText = `Au revoir ${access.name} ! Profitez bien de votre séjour.`;
      }
    }

    /* ═══════════════════════════════════════════════
       ÉTAPE 3 : Synthèse vocale (TTS)
       ═══════════════════════════════════════════════ */
    console.log("[GUEST-VOICE-STREAM] Étape 3 : Synthèse vocale...");

    // Tentative : z-ai-web-dev-sdk TTS
    const ttsResult = await ttsWithSDK(responseText);

    if (ttsResult) {
      console.log("[GUEST-VOICE-STREAM] TTS OK, taille:", ttsResult.base64.length);
      return NextResponse.json<VoiceStreamSuccess>({
        success: true,
        text: responseText,
        audioBase64: ttsResult.base64,
        audioMimeType: ttsResult.mimeType,
      });
    }

    // Fallback : réponse texte seul
    console.log("[GUEST-VOICE-STREAM] TTS échoué, réponse texte uniquement");
    return NextResponse.json<VoiceStreamSuccess>({
      success: true,
      text: responseText,
    });
  } catch (error) {
    console.error("[GUEST-VOICE-STREAM] Erreur inattendue:", error);
    return NextResponse.json<VoiceStreamError>(
      { success: false, error: "Erreur serveur — veuillez réessayer" },
      { status: 500 }
    );
  }
}
