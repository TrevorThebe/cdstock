/**
 * Product type definition
 */

import { LocationType } from '../lib/locationUtils';

export interface ProductBase {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
}

export interface InventoryProduct extends ProductBase {
    quantity: number;
    minQuantity: number;
    maxQuantity?: number;
    location: string; // Raw location string
    normalizedLocation: LocationType; // Normalized location
    price: number;
    cost?: number;
    category?: string;
    supplier?: string;
    lastStocked?: Date | string;
    expiryDate?: Date | string;
}

export interface Product extends InventoryProduct {
    createdAt?: Date | string;
    updatedAt?: Date | string;
    createdBy?: string;
    updatedBy?: string;
    images?: string[];
    tags?: string[];
    isActive?: boolean;
}

// For API responses
export interface ProductResponse extends Omit<Product, 'lastStocked' | 'expiryDate' | 'createdAt' | 'updatedAt'> {
    lastStocked: string | null;
    expiryDate: string | null;
    createdAt: string;
    updatedAt: string;
}

// For form inputs
export interface ProductFormValues extends Omit<Product,
    'id' | 'createdAt' | 'updatedAt' | 'normalizedLocation' | 'lastStocked' | 'expiryDate'
> {
    id?: string;
    lastStocked?: string;
    expiryDate?: string;
}

// Type guards
export function isProduct(obj: any): obj is Product {
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.quantity === 'number';
}

export interface Product {
    id: string;
    name: string;
    quantity: number;
    minQuantity: number;
    price: number;
    location: string;  // Raw location from database
    category?: string; // Will be added during normalization
}