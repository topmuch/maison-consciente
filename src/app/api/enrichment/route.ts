import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";
import { randomUUID } from "crypto";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Enrichment API
   
   GET  /api/enrichment
   Returns: groceries, rituals, moods, contacts, maintenance
   
   POST /api/enrichment
   Actions: submit-mood, add-grocery, toggle-grocery,
            delete-grocery, toggle-ritual, create-guest-link,
            late-arrival, add-contact, delete-contact,
            toggle-maintenance
   ═══════════════════════════════════════════════════════ */

/* ── GET: Fetch all enrichment data for dashboard ── */
export async function GET() {
  try {
    const { householdId, user } = await requireHousehold();
    const now = new Date();
    const hour = now.getHours();
    const timeFilter = hour < 14 ? "morning" : "evening";

    const [groceries, rituals, moods, contacts, maintenance] = await Promise.all([
      db.groceryItem.findMany({
        where: { householdId: householdId! },
        orderBy: { isBought: "asc" },
      }),
      db.ritualTask.findMany({
        where: { householdId: householdId!, timeOfDay: timeFilter },
        take: 6,
      }),
      db.moodEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 7,
      }),
      db.emergencyContact.findMany({
        where: { householdId: householdId! },
      }),
      db.maintenanceTask.findMany({
        where: { householdId: householdId! },
        orderBy: [{ isDone: "asc" }, { dueDate: "asc" }],
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        groceries,
        rituals,
        moods,
        contacts,
        maintenance,
        timeFilter,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")
    ) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Enrichment GET error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/* ── POST: Handle enrichment actions ── */
export async function POST(request: NextRequest) {
  try {
    const { householdId, user } = await requireHousehold();
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    switch (action) {
      /* ── Submit Mood ── */
      case "submit-mood": {
        const { mood, note } = body;
        if (typeof mood !== "number" || mood < 1 || mood > 5) {
          return NextResponse.json(
            { success: false, error: "Humeur invalide (1-5)" },
            { status: 400 }
          );
        }
        const entry = await db.moodEntry.create({
          data: {
            userId: user.id,
            mood,
            note: typeof note === "string" ? note.slice(0, 280) : null,
          },
        });
        return NextResponse.json({ success: true, data: entry });
      }

      /* ── Add Grocery Item ── */
      case "add-grocery": {
        const { name, category } = body;
        if (!name || !name.trim()) {
          return NextResponse.json(
            { success: false, error: "Nom requis" },
            { status: 400 }
          );
        }
        const item = await db.groceryItem.create({
          data: {
            householdId: householdId!,
            name: name.trim().slice(0, 100),
            category: category || "food",
          },
        });
        return NextResponse.json({ success: true, data: item });
      }

      /* ── Toggle Grocery Bought ── */
      case "toggle-grocery": {
        const { id, isBought } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "ID requis" },
            { status: 400 }
          );
        }
        const item = await db.groceryItem.update({
          where: { id, householdId: householdId! },
          data: { isBought: !!isBought },
        });
        return NextResponse.json({ success: true, data: item });
      }

      /* ── Delete Grocery Item ── */
      case "delete-grocery": {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "ID requis" },
            { status: 400 }
          );
        }
        await db.groceryItem.delete({
          where: { id, householdId: householdId! },
        });
        return NextResponse.json({ success: true });
      }

      /* ── Toggle Ritual ── */
      case "toggle-ritual": {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "ID requis" },
            { status: 400 }
          );
        }
        const existing = await db.ritualTask.findFirst({
          where: { id, householdId },
        });
        if (!existing) {
          return NextResponse.json(
            { success: false, error: "Tâche introuvable" },
            { status: 404 }
          );
        }
        const task = await db.ritualTask.update({
          where: { id },
          data: { isCompleted: !existing.isCompleted },
        });
        return NextResponse.json({ success: true, data: task });
      }

      /* ── Create Guest Link ── */
      case "create-guest-link": {
        const { name, daysValid } = body;
        if (!name || !name.trim()) {
          return NextResponse.json(
            { success: false, error: "Nom requis" },
            { status: 400 }
          );
        }
        const days = typeof daysValid === "number" ? daysValid : 3;
        const token = randomUUID().replace(/-/g, "").slice(0, 24);
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        const guest = await db.guestAccess.create({
          data: {
            householdId: householdId!,
            name: name.trim().slice(0, 100),
            token,
            expiresAt,
          },
        });
        return NextResponse.json({ success: true, data: guest });
      }

      /* ── Late Arrival Alert ── */
      case "late-arrival": {
        const msg = await db.message.create({
          data: {
            householdId: householdId!,
            senderId: user.id,
            content: "🌙 Je rentre tard ce soir. À tout à l'heure.",
            type: "alert",
            isRead: false,
          },
        });
        return NextResponse.json({ success: true, data: msg });
      }

      /* ── Add Emergency Contact ── */
      case "add-contact": {
        const { name, phone, type } = body;
        if (!name?.trim() || !phone?.trim()) {
          return NextResponse.json(
            { success: false, error: "Nom et téléphone requis" },
            { status: 400 }
          );
        }
        const contact = await db.emergencyContact.create({
          data: {
            householdId: householdId!,
            name: name.trim().slice(0, 100),
            phone: phone.trim().slice(0, 30),
            type: type || "emergency",
          },
        });
        return NextResponse.json({ success: true, data: contact });
      }

      /* ── Delete Emergency Contact ── */
      case "delete-contact": {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "ID requis" },
            { status: 400 }
          );
        }
        await db.emergencyContact.delete({
          where: { id, householdId: householdId! },
        });
        return NextResponse.json({ success: true });
      }

      /* ── Toggle Maintenance Task ── */
      case "toggle-maintenance": {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "ID requis" },
            { status: 400 }
          );
        }
        const task = await db.maintenanceTask.findUnique({
          where: { id },
        });
        if (!task || task.householdId !== householdId) {
          return NextResponse.json(
            { success: false, error: "Tâche introuvable" },
            { status: 404 }
          );
        }
        const updated = await db.maintenanceTask.update({
          where: { id },
          data: { isDone: !task.isDone },
        });
        return NextResponse.json({ success: true, data: updated });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Action non reconnue" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")
    ) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    if (
      error instanceof Error &&
      (error.message.includes("Record to update not found") ||
        error.message.includes("Record to delete not found"))
    ) {
      return NextResponse.json(
        { success: false, error: "Enregistrement introuvable" },
        { status: 404 }
      );
    }
    console.error("Enrichment POST error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
