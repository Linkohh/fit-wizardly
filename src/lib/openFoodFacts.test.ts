import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NUTRITION_LOOKUP_CONSENT_STORAGE_KEY,
} from '@/lib/consent';

const fetchMock = vi.fn<typeof fetch>();

async function loadOpenFoodFacts() {
  return import('./openFoodFacts');
}

describe('openFoodFacts', () => {
  beforeEach(() => {
    window.localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('does not perform network lookups before nutrition consent is stored', async () => {
    const { searchProducts, getProductByBarcode } = await loadOpenFoodFacts();

    await expect(searchProducts('oats')).resolves.toEqual([]);
    await expect(getProductByBarcode('12345678')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('performs the OpenFoodFacts search once consent is granted', async () => {
    window.localStorage.setItem(NUTRITION_LOOKUP_CONSENT_STORAGE_KEY, 'true');
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          products: [
            {
              code: '123',
              product_name: 'Oats',
              nutriments: {},
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const { searchProducts } = await loadOpenFoodFacts();

    await expect(searchProducts('  oats  ')).resolves.toHaveLength(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBeInstanceOf(URL);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      'https://world.openfoodfacts.org/cgi/search.pl'
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('search_terms=oats');
  });
});
