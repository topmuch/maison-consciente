/* ═══════════════════════════════════════════════════════
   MAELLIS — Retell AI Webhook Endpoint

   POST /api/webhooks/retell-analysis

   Receives Retell AI call completion webhooks:
   - Accepts Retell webhook payload (transcription, call_id, duration, metadata)
   - Looks up DailyCheck by callId
   - Updates DailyCheck with transcription, duration, status
   - Triggers async Gemini analysis (fire-and-forget)
   - If departure check: triggers stay review report generation

   This route is PUBLIC — called by Retell AI, not the user.
   Responds quickly (200 OK) and does analysis asynchronously.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeDailyCheckTranscription } from "@/lib/gemini-analysis";
import { generateStayReviewReport } from "@/lib/gemini-analysis";

export const dynamic = "force-dynamic";

/* ═══════════════════════════════════════════════════════
   Retell Webhook Payload Shape
   ═══════════════════════════════════════════════════════ */

interface RetellCallEvent {
  call_id: string;
  event: string;
  direction: string;
  from_number: string;
  to_number: string;
  start_time: string;
  end_time: string;
  duration: number;
  transcript?: string;
  transcript_object?: {
    words?: Array<{ text: string; start: number; end: number; speaker: string }>;
    chunks?: Array<{ text: string; timestamp_start: number; timestamp_end: number }>;
  };
  metadata?: {
    dailyCheckId?: string;
    checkInStateId?: string;
    householdId?: string;
    checkType?: string;
    guestName?: string;
    timestamp?: string;
  };
  call_analysis?: {
    reasoning?: string;
    user_sentiment?: string;
  };
  disconnection_reason?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RetellCallEvent = await req.json();

    // Only process call completion events
    const eventType = body.event;
    if (eventType !== "call_ended" && eventType !== "call_transcription") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const callId = body.call_id;
    if (!callId) {
      console.warn("[Retell Webhook] Missing call_id");
      return NextResponse.json({ received: true, ignored: true });
    }

    // Find the DailyCheck by callId
    const dailyCheck = await db.dailyCheck.findFirst({
      where: { callId },
    });

    if (!dailyCheck) {
      console.warn(`[Retell Webhook] No DailyCheck found for call_id: ${callId}`);
      return NextResponse.json({ received: true, ignored: true });
    }

    // Process based on event type
    if (eventType === "call_ended") {
      // Extract duration
      const durationSec = body.duration || null;

      // Determine status based on disconnection reason
      const disconnectionReason = body.disconnection_reason;
      let status: string;

      if (disconnectionReason === "no_answer" || disconnectionReason === "voicemail") {
        status = "no_answer";
      } else if (disconnectionReason === "error") {
        status = "failed";
      } else {
        status = "completed";
      }

      // Extract transcription from the transcript_object or transcript field
      let transcription = body.transcript || null;

      if (!transcription && body.transcript_object?.chunks) {
        transcription = body.transcript_object.chunks
          .map((chunk) => chunk.text)
          .join(" ");
      }

      if (!transcription && body.transcript_object?.words) {
        transcription = body.transcript_object.words
          .map((w) => w.text)
          .join(" ");
      }

      // Update DailyCheck record
      await db.dailyCheck.update({
        where: { id: dailyCheck.id },
        data: {
          durationSec,
          transcription: transcription ? transcription.substring(0, 10000) : null,
          answeredAt: body.start_time ? new Date(body.start_time) : null,
          status,
        },
      });

      console.log(
        `[Retell Webhook] Call ended: ${callId} — status: ${status}, duration: ${durationSec}s, hasTranscription: ${!!transcription}`
      );

      // Fire-and-forget: Trigger Gemini analysis if we have a transcription
      if (transcription && transcription.trim().length > 10 && status === "completed") {
        // Async — do not await
        (async () => {
          try {
            await analyzeDailyCheckTranscription(dailyCheck.id, transcription!);

            // If departure check, also generate stay review report
            if (dailyCheck.checkType === "departure" && dailyCheck.checkInStateId) {
              await generateStayReviewReport(dailyCheck.checkInStateId);
            }
          } catch (analysisError) {
            console.error(
              "[Retell Webhook] Async analysis failed:",
              analysisError
            );
          }
        })();
      }
    }

    // For call_transcription events, we just store partial transcription
    // (the final transcription comes with call_ended)
    if (eventType === "call_transcription") {
      const partialTranscription = body.transcript;
      if (partialTranscription) {
        // Append to existing transcription if present
        const existing = dailyCheck.transcription || "";
        await db.dailyCheck.update({
          where: { id: dailyCheck.id },
          data: {
            transcription: existing
              ? `${existing} ${partialTranscription}`
              : partialTranscription,
          },
        });
      }
    }

    // Respond quickly — Retell expects fast responses
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Retell Webhook] Error:", error);
    return NextResponse.json({ received: true });
  }
}
