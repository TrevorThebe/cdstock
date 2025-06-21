import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { storage } from '@/lib/storage';
import { Product } from '@/types';

/**
 * Updates a product in local storage by its id.
 * @param productId The id of the product to update.
 * @param updatedFields An object with the fields to update.
 * @returns {boolean} True if updated, false if product not found.
 */
export function updateLocalProduct(productId: string, updatedFields: Partial<Product>): boolean {
  const products = storage.getProducts();
  const index = products.findIndex(p => p.id === productId);

  if (index === -1) return false; // Product not found

  products[index] = {
    ...products[index],
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };

  storage.saveProducts(products);
  return true;
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
