/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Food & Restaurants Service
   Yelp Fusion: restaurant search, Open Food Facts: product info
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { safeFetch, fetchWithCache, getDefinition } from '@/lib/external-apis';
import { decryptSecret } from '@/lib/aes-crypto';
import type { ApiKey } from '@/lib/external-apis';

/* ─── Types ─── */

export interface YelpBusiness {
  id: string;
  name: string;
  url: string;
  rating: number;
  review_count: number;
  price: string | null;
  distance: number;
  location: {
    address1: string;
    city: string;
    zip_code: string;
    country: string;
    display_address: string[];
  };
  categories: Array<{ alias: string; title: string }>;
  image_url: string | null;
  phone: string;
  is_closed: boolean;
}

export interface ProductInfo {
  productName: string;
  barcode?: string;
  brands?: string;
  categories?: string;
  nutriscoreGrade?: string;
  novaGroup?: number;
  imageFrontUrl?: string;
  ingredientsText?: string;
  allergens?: string;
  nutriScore?: string;
  countries?: string;
}

interface YelpResponse {
  businesses: Array<{
    id: string;
    name: string;
    url: string;
    rating: number;
    review_count: number;
    price: string | null;
    distance: number;
    location: {
      address1: string;
      city: string;
      zip_code: string;
      country: string;
      display_address: string[];
    };
    categories: Array<{ alias: string; title: string }>;
    image_url: string | null;
    phone: string;
    is_closed: boolean;
  }>;
  total: number;
}

interface OpenFoodFactsResponse {
  status: number;
  status_verbose: string;
  product: {
    product_name: string;
    brands?: string;
    categories?: string;
    nutriscore_grade?: string;
    nova_group?: number;
    image_front_url?: string;
    ingredients_text_fr?: string;
    allergens?: string;
    nutriscore_score?: number;
    countries?: string;
  } | null;
}

/* ─── Helpers ─── */

async function getApiConfig(serviceKey: ApiKey): Promise<{ active: boolean; apiKey?: string }> {
  const config = await db.apiConfig.findUnique({ where: { serviceKey } });
  if (!config || !config.isActive) return { active: false };
  return { active: true, apiKey: config.apiKey ? decryptSecret(config.apiKey) : undefined };
}

/* ─── Fallback ─── */

/* ─── Functions ─── */

export async function searchRestaurants(
  category: string,
  lat: number,
  lon: number
): Promise<{
  success: boolean;
  data: YelpBusiness[] | Array<{ id: string; name: string; category: string; address: string; distanceMin: number; description: string; rating?: number }>;
  fallback: boolean;
}> {
  const serviceKey = 'YELP' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    // Fallback: query local PointOfInterest database
    try {
      const pois = await db.pointOfInterest.findMany({
        where: {
          category: { contains: category },
          isActive: true,
        },
        take: 20,
        orderBy: { distanceMin: 'asc' },
      });

      if (pois.length > 0) {
        const data = pois.map((poi) => ({
          id: poi.id,
          name: poi.name,
          category: poi.category,
          address: poi.address,
          distanceMin: poi.distanceMin,
          description: poi.description,
          rating: poi.rating ?? undefined,
        }));
        return { success: true, data, fallback: true };
      }
    } catch {
      // DB query failed, return empty
    }

    return { success: false, data: [], fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return { success: false, data: [], fallback: true };
  }

  try {
    const result = await fetchWithCache<YelpResponse>(
      def,
      `yelp:search:${category}:${lat.toFixed(2)}:${lon.toFixed(2)}`,
      async () => {
        const url = `${def.baseUrl}/businesses/search?latitude=${lat}&longitude=${lon}&categories=${category}&locale=fr_FR&limit=20`;
        const res = await safeFetch(url, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        }, def.timeoutMs);
        if (!res.ok) throw new Error(`Yelp returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.businesses) {
      // Fallback to local POI
      try {
        const pois = await db.pointOfInterest.findMany({
          where: {
            category: { contains: category },
            isActive: true,
          },
          take: 20,
          orderBy: { distanceMin: 'asc' },
        });

        if (pois.length > 0) {
          const data = pois.map((poi) => ({
            id: poi.id,
            name: poi.name,
            category: poi.category,
            address: poi.address,
            distanceMin: poi.distanceMin,
            description: poi.description,
            rating: poi.rating ?? undefined,
          }));
          return { success: true, data, fallback: true };
        }
      } catch {
        // DB query failed
      }

      return { success: false, data: [], fallback: true };
    }

    const businesses: YelpBusiness[] = result.data.businesses;
    return { success: true, data: businesses, fallback: false };
  } catch {
    // Fallback to local POI
    try {
      const pois = await db.pointOfInterest.findMany({
        where: {
          category: { contains: category },
          isActive: true,
        },
        take: 20,
        orderBy: { distanceMin: 'asc' },
      });

      if (pois.length > 0) {
        const data = pois.map((poi) => ({
          id: poi.id,
          name: poi.name,
          category: poi.category,
          address: poi.address,
          distanceMin: poi.distanceMin,
          description: poi.description,
          rating: poi.rating ?? undefined,
        }));
        return { success: true, data, fallback: true };
      }
    } catch {
      // DB query failed
    }

    return { success: false, data: [], fallback: true };
  }
}

export async function getProductInfo(barcode: string): Promise<{
  success: boolean;
  data: ProductInfo;
  fallback: boolean;
}> {
  const serviceKey = 'OPENFOODFACTS' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active) {
    return {
      success: false,
      data: { productName: `Produit non trouvé dans notre base locale`, barcode },
      fallback: true,
    };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return {
      success: false,
      data: { productName: `Produit non trouvé dans notre base locale`, barcode },
      fallback: true,
    };
  }

  try {
    const result = await fetchWithCache<OpenFoodFactsResponse>(
      def,
      `off:product:${barcode}`,
      async () => {
        const url = `${def.baseUrl}/api/v0/product/${barcode}.json`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.product) {
      return {
        success: false,
        data: { productName: `Produit non trouvé dans notre base locale`, barcode },
        fallback: true,
      };
    }

    const p = result.data.product;
    const info: ProductInfo = {
      productName: p.product_name || `Code-barres ${barcode}`,
      brands: p.brands || undefined,
      categories: p.categories || undefined,
      nutriscoreGrade: p.nutriscore_grade || undefined,
      novaGroup: p.nova_group ?? undefined,
      imageFrontUrl: p.image_front_url || undefined,
      ingredientsText: p.ingredients_text_fr || undefined,
      allergens: p.allergens || undefined,
      countries: p.countries || undefined,
    };

    return { success: true, data: info, fallback: false };
  } catch {
    return {
      success: false,
      data: { productName: `Produit non trouvé dans notre base locale`, barcode },
      fallback: true,
    };
  }
}
