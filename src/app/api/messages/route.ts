import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";
import { createMessageSchema } from "@/core/validations/schemas";

// GET: List messages for household
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const skip = (page - 1) * limit;

    const where = { householdId: householdId! };

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.message.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("List messages error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST: Create message
export async function POST(request: NextRequest) {
  try {
    const { user, householdId } = await requireHousehold();

    const body = await request.json();
    const parsed = createMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { content, type } = parsed.data;

    const message = await db.message.create({
      data: {
        householdId: householdId!,
        senderId: user.id,
        content,
        type: type || "note",
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Create message error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
