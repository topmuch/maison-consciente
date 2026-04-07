import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";

// PUT: Mark message as read
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = await params;

    // Verify message belongs to user's household
    const message = await db.message.findFirst({
      where: { id, householdId: householdId! },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message introuvable" },
        { status: 404 }
      );
    }

    const updatedMessage = await db.message.update({
      where: { id },
      data: { isRead: true },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Mark message read error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
