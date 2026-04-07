import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
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

    const body = await request.json();
    const { action } = body;

    if (action === "toggle-grocery") {
      const { itemId } = body;
      if (!itemId) {
        return NextResponse.json({ success: false, error: "itemId requis" }, { status: 400 });
      }

      const item = await db.groceryItem.findUnique({ where: { id: itemId } });
      if (!item || item.householdId !== household.id) {
        return NextResponse.json({ success: false, error: "Non trouvé" }, { status: 404 });
      }

      await db.groceryItem.update({
        where: { id: itemId },
        data: { isBought: !item.isBought },
      });

      return NextResponse.json({ success: true, isBought: !item.isBought });
    }

    if (action === "add-message") {
      const { content } = body;
      if (!content?.trim()) {
        return NextResponse.json({ success: false, error: "Message vide" }, { status: 400 });
      }

      // Find any member of household to attribute message to, or leave senderId null
      const member = await db.user.findFirst({
        where: { householdId: household.id },
        select: { id: true },
      });

      await db.message.create({
        data: {
          id: randomUUID(),
          householdId: household.id,
          senderId: member?.id || null,
          content: `📱 Tablette: ${content.trim()}`,
          type: "note",
          isPublic: true,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    console.error("[Display Action] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
