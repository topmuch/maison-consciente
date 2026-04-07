import { NextRequest } from "next/server";
import { requireHousehold } from "@/core/auth/guards";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// Simple SSE endpoint using polling approach
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const encoder = new TextEncoder();
    const connectionId = randomUUID();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection event
        const connectEvent = `event: connected\ndata: ${JSON.stringify({ connectionId, householdId })}\nid: 0\n\n`;
        controller.enqueue(encoder.encode(connectEvent));

        // Heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            const ping = `event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\nid: ${Date.now()}\n\n`;
            controller.enqueue(encoder.encode(ping));
          } catch {
            clearInterval(heartbeat);
            controller.close();
          }
        }, 30000);

        // Close heartbeat on abort
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          controller.close();
        });
      },
      cancel() {
        // Cleanup on cancel
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return new Response(JSON.stringify({ success: false, error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: false, error: "Erreur interne du serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
