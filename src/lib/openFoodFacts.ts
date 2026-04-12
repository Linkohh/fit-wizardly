import { hasNutritionLookupConsent } from '@/lib/consent';

export interface OFFFoodProduct {
  code: string;
  product_name: string;
  brands?: string;
  image_url?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    'proteins_100g'?: number;
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
  };
}

const OPEN_FOOD_FACTS_ORIGIN = 'https://world.openfoodfacts.org';
const REQUEST_TIMEOUT_MS = 5000;

function canUseThirdPartyNutritionLookup() {
  return hasNutritionLookupConsent();
}

function buildSearchUrl(query: string) {
  const url = new URL('/cgi/search.pl', OPEN_FOOD_FACTS_ORIGIN);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '10');
  url.searchParams.set('fields', 'code,product_name,brands,image_url,nutriments');
  return url;
}

function buildBarcodeUrl(barcode: string) {
  const url = new URL(`/api/v0/product/${encodeURIComponent(barcode)}.json`, OPEN_FOOD_FACTS_ORIGIN);
  url.searchParams.set('fields', 'code,product_name,brands,image_url,nutriments');
  return url;
}

function isValidBarcode(barcode: string) {
  return /^[0-9]{8,14}$/.test(barcode);
}

export const searchProducts = async (query: string): Promise<OFFFoodProduct[]> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || trimmedQuery.length < 3 || !canUseThirdPartyNutritionLookup()) {
    return [];
  }

  try {
    const response = await fetch(buildSearchUrl(trimmedQuery), {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = (await response.json()) as { products?: unknown[] };
    if (!Array.isArray(data.products)) return [];
    return data.products as OFFFoodProduct[];
  } catch {
    return [];
  }
};

export const getProductByBarcode = async (barcode: string): Promise<OFFFoodProduct | null> => {
  const trimmedBarcode = barcode.trim();
  if (!trimmedBarcode || !isValidBarcode(trimmedBarcode) || !canUseThirdPartyNutritionLookup()) {
    return null;
  }

  try {
    const response = await fetch(buildBarcodeUrl(trimmedBarcode), {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { product?: OFFFoodProduct | null };
    return data.product ?? null;
  } catch {
    return null;
  }
};
