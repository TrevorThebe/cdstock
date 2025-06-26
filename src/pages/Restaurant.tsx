import React from 'react';
import { ProductListByLocation } from '@/components/ProductListByLocation';

const RestaurantPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-6">Restaurant Products</h1>
    <ProductListByLocation locationName="Restaurant" />
  </div>
);

export default RestaurantPage;
