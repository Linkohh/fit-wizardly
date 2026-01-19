export interface OFFFoodProduct {
    code: string;
    product_name: string;
    brands?: string;
    image_url?: string;
    nutriments: {
        "energy-kcal_100g"?: number;
        "proteins_100g"?: number;
        "carbohydrates_100g"?: number;
        "fat_100g"?: number;
    };
}

export const searchProducts = async (query: string): Promise<OFFFoodProduct[]> => {
    if (!query || query.length < 3) return [];

    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=code,product_name,brands,image_url,nutriments`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Search failed");

        const data = await response.json();
        return data.products || [];
    } catch (error) {
        console.error("OpenFoodFacts search error:", error);
        return [];
    }
};

export const getProductByBarcode = async (barcode: string): Promise<OFFFoodProduct | null> => {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json?fields=code,product_name,brands,image_url,nutriments`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        return data.product || null;
    } catch (e) {
        return null;
    }
}
