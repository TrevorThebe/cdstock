import React from 'react';
import { ProductListByLocation } from '@/components/ProductListByLocation';

const BakeryPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-6">Bakery Products</h1>
<ProductListByLocation locationName="Bakery" />
    </div> 
);

export default BakeryPage;
