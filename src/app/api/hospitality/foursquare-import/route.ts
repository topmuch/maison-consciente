/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Foursquare POI Import API
   Import nearby Points of Interest from Foursquare Places.
   Smart dedup: updates existing POIs with similar name+address.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";
import { z } from "zod";

// ─── Zod Schemas ───

const foursquareImportSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radius: z.union([z.literal(500), z.literal(1000)]),
  categories: z.array(z.string()),
});

// ─── Foursquare Category EN → FR Mapping ───

const CATEGORY_MAP: Record<string, string> = {
  food: "Alimentation",
  pharmacy: "Pharmacie",
  hospital: "Urgences",
  transport: "Transport",
  bakery: "Boulangerie",
  supermarket: "Supérette",
  cafe: "Café",
  restaurant: "Restaurant",
  bar: "Bar",
  museum: "Musée",
  park: "Parc",
  spa: "Spa",
  market: "Marché",
  activity: "Activité",
  nightlife: "Vie nocturne",
};

/** Map an array of Foursquare category strings to French labels */
function mapCategoriesToFR(categories: string[]): string[] {
  return categories
    .map((c) => CATEGORY_MAP[c.toLowerCase()])
    .filter((c): c is string => typeof c === "string");
}

/** Pick the best French category from a list, or fall back to "Activité" */
function pickPrimaryCategory(categories: string[]): string {
  const mapped = mapCategoriesToFR(categories);
  return mapped.length > 0 ? mapped[0] : "Activité";
}

// ─── Foursquare API Types ───

interface FoursquareCategory {
  id: string;
  name: string;
  short_name?: string;
}

interface FoursquareLocation {
  address?: string;
  locality?: string;
  region?: string;
  country?: string;
  formatted_address?: string;
}

interface FoursquareResult {
  fsq_id: string;
  name: string;
  categories: FoursquareCategory[];
  distance: number;
  location: FoursquareLocation;
  rating?: number;
  description?: string;
  photo?: {
    prefix: string;
    suffix: string;
    width: number;
    height: number;
  };
}

// ─── POST: Import nearby POIs from Foursquare ───

export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const body = await request.json();
    const parsed = foursquareImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { lat, lon, radius, categories } = parsed.data;

    // Check Foursquare API key
    const apiKey = process.env.FOURSQUARE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "API Foursquare non configurée",
      });
    }

    // Build category filter string
    const categoryParam = categories.length > 0 ? `&categories=${categories.join(",")}` : "";

    // Call Foursquare Places API
    const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=${radius}&limit=50${categoryParam}`;

    let foursquareResults: FoursquareResult[];
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (response.status === 401 || response.status === 403) {
        console.error("[FOURSQUARE] Authentication error:", response.status);
        return NextResponse.json({
          success: false,
          error: "Clé API Foursquare invalide",
        });
      }

      if (!response.ok) {
        console.error("[FOURSQUARE] API error:", response.status, response.statusText);
        return NextResponse.json({
          success: false,
          error: "Erreur API Foursquare",
        });
      }

      const data = await response.json();
      foursquareResults = Array.isArray(data?.results) ? data.results as FoursquareResult[] : [];
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        return NextResponse.json({
          success: false,
          error: "L'API Foursquare a mis trop de temps à répondre",
        });
      }
      return NextResponse.json({
        success: false,
        error: "Erreur de connexion à l'API Foursquare",
      });
    }

    // Get all existing POIs for this household for dedup checking
    const existingPOIs = await db.pointOfInterest.findMany({
      where: { householdId },
      select: { id: true, name: true, address: true },
    });

    // Batch process: collect all DB operations and execute in parallel
    const updateOps: { id: string; data: Record<string, unknown> }[] = [];
    const createOps: Record<string, unknown>[] = [];

    for (const result of foursquareResults) {
      const name = result.name?.trim() ?? "";
      if (!name) continue;

      const categoryNames = result.categories?.map((c) => c.name) ?? [];
      const primaryCategory = pickPrimaryCategory(categoryNames);
      const mappedCategories = mapCategoriesToFR(categoryNames);

      const address = result.location?.formatted_address ?? "";
      const distanceMin = Math.round((result.distance ?? 0) / 80);
      const rating = result.rating ?? null;
      const description = result.description ?? "";
      const imageUrl = result.photo
        ? `${result.photo.prefix}original${result.photo.suffix}`
        : null;

      const existing = existingPOIs.find(
        (poi) =>
          poi.name.toLowerCase() === name.toLowerCase() &&
          (!poi.address || !address || poi.address.toLowerCase() === address.toLowerCase())
      );

      const payload = {
        category: primaryCategory,
        distanceMin,
        description,
        rating,
        imageUrl,
        address,
        tags: JSON.stringify(mappedCategories),
        isActive: true,
      };

      if (existing) {
        updateOps.push({ id: existing.id, data: payload });
      } else {
        createOps.push({
          householdId,
          name,
          ...payload,
        });
      }
    }

    // Execute all DB operations in parallel via Promise.all
    const [updateResults, createResults] = await Promise.all([
      Promise.all(
        updateOps.map((op) =>
          db.pointOfInterest.update({ where: { id: op.id }, data: op.data })
        )
      ),
      Promise.all(
        createOps.map((op) =>
          db.pointOfInterest.create({ data: op as never })
        )
      ),
    ]);

    const updated = updateResults.length;
    const imported = createResults.length;

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total: imported + updated,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[FOURSQUARE-IMPORT] POST error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── GET: List POIs for this household (paginated, sorted by category) ───

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { householdId, isActive: true };
    if (category) {
      where.category = category;
    }

    const [pois, total] = await Promise.all([
      db.pointOfInterest.findMany({
        where,
        orderBy: [{ category: "asc" }, { distanceMin: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pointOfInterest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      pois,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[FOURSQUARE-IMPORT] GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
