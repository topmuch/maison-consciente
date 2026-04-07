import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const household = await db.household.findUnique({
      where: { displayToken: token },
    });

    if (!household?.displayEnabled) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\nid: ${Date.now()}\n\n`)
          );
        };

        send("connected", { time: new Date().toISOString(), household: household.name });

        // Poll for new public messages every 5 seconds
        let lastCheck = Date.now();
        const interval = setInterval(async () => {
          try {
            const newMessages = await db.message.count({
              where: {
                householdId: household.id,
                isPublic: true,
                createdAt: { gt: new Date(lastCheck) },
              },
            });
            if (newMessages > 0) {
              send("messages", { count: newMessages });
            }

            // Also check for grocery changes
            const newGroceries = await db.groceryItem.count({
              where: {
                householdId: household.id,
                updatedAt: { gt: new Date(lastCheck) },
              },
            });
            if (newGroceries > 0) {
              send("groceries", { count: newGroceries });
            }

            lastCheck = Date.now();
          } catch {
            // continue polling
          }
        }, 5000);

        // Heartbeat every 30s
        const heartbeat = setInterval(() => {
          try {
            send("ping", { ts: Date.now() });
          } catch {
            clearInterval(heartbeat);
            clearInterval(interval);
            controller.close();
          }
        }, 30000);

        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          clearInterval(heartbeat);
          controller.close();
        });
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
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
