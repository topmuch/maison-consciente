import { NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";
import QRCode from "qrcode";

export async function GET(request: Request) {
  try {
    const { householdId } = await requireHousehold();

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");

    if (!zoneId) {
      return NextResponse.json(
        { success: false, error: "Paramètre zoneId requis" },
        { status: 400 }
      );
    }

    // Verify zone belongs to user's household
    const zone = await db.zone.findFirst({
      where: { id: zoneId, householdId: householdId! },
    });

    if (!zone) {
      return NextResponse.json(
        { success: false, error: "Zone introuvable" },
        { status: 404 }
      );
    }

    // Generate QR code SVG
    const svgString = await QRCode.toString(zone.qrCode, {
      type: "svg",
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return new NextResponse(svgString, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Generate QR code error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
