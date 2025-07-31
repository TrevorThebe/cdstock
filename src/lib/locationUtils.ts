import { Product } from '@/types/product';

type ProductCategory = 'restaurant' | 'bakery' | 'other';

export const normalizeProduct = (product: any): Product => {
    const location = product.location?.toString().trim().toLowerCase() || 'other';

    // Determine category based on location
    let category: ProductCategory = 'other';
    if (/rest|resto|dining|kitchen/.test(location)) category = 'restaurant';
    if (/bakery|bake|bread|pastry/.test(location)) category = 'bakery';

    return {
        ...product,
        quantity: Number(product.quantity) || 0,
        minQuantity: Number(product.minQuantity) || 5, // Default minimum
        price: Number(product.price) || 0,
        category,
        location // Keep original for reference
    };
};

export const getCategoryCounts = (products: Product[]) => {
    const counts = {
        restaurant: 0,
        bakery: 0,
        other: 0
    };

    products.forEach(product => {
        if (product.category === 'restaurant') counts.restaurant++;
        else if (product.category === 'bakery') counts.bakery++;
        else counts.other++;
    });

    return counts;
};