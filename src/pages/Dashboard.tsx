import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    restaurantItems: 0,
    bakeryItems: 0,
    totalValue: 0,
    restaurantValue: 0,
    bakeryValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          locations (
            location
          )
        `);

      if (error) throw error;

      // Defensive mapping for locationName
      const mappedProducts = (data || []).map((p: any) => ({
        console.log('Raw data from Supabase:', data);
        if(error) console.error('Supabase error:', error);
        console.log('Mapped products:', mappedProducts);
        console.log('Restaurant products:', restaurantProducts);
        console.log('Bakery products:', bakeryProducts);
        console.log('Low stock products:', lowStock);
        console.log('Total value:', totalValue);
        console.log('Restaurant value:', restaurantValue);
        console.log('Bakery value:', bakeryValue);
        ...p,
        quantity: Number(p.quantity),
        min_quantity: Number(p.min_quantity),
        locationName: p.locations?.location
          ? String(p.locations.location).trim().toLowerCase()
          : (p.location || '').toLowerCase(),
      }));
      console.log('Mapped location names:', mappedProducts.map(p => p.locationName));

      const restaurantProducts = mappedProducts.filter(
const restaurantProducts = mappedProducts.filter(
        p => p.locationName?.includes('restaurant')
      );
      );
const bakeryProducts = mappedProducts.filter(
const bakeryProducts = mappedProducts.filter(
  p => p.locationName?.includes('bakery')
);
      );
const lowStock = mappedProducts.filter(
  p => p.quantity <= p.min_quantity
);

const totalValue = mappedProducts.reduce(
  (sum, p) => sum + ((Number(p.price) || 0) * (Number(p.quantity) || 0)), 0
);
const restaurantValue = restaurantProducts.reduce(
  (sum, p) => sum + ((Number(p.price) || 0) * (Number(p.quantity) || 0)), 0
);
const bakeryValue = bakeryProducts.reduce(
  (sum, p) => sum + ((Number(p.price) || 0) * (Number(p.quantity) || 0)), 0
);

setProducts(mappedProducts);
setStats({
  totalProducts: mappedProducts.length,
  lowStockItems: lowStock.length,
  restaurantItems: restaurantProducts.length,
  bakeryItems: bakeryProducts.length,
  totalValue,
  restaurantValue,
  bakeryValue,
});
    } catch (error) {
  setProducts([]);
  setStats({
    totalProducts: 0,
    lowStockItems: 0,
    restaurantItems: 0,
    bakeryItems: 0,
    totalValue: 0,
    restaurantValue: 0,
    bakeryValue: 0
  });
} finally {
  setLoading(false);
}
  };

if (loading) {
  return (
    <div className="p-6 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

return (
  <div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.lowStockItems}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.restaurantItems}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bakery Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.bakeryItems}</div>
        </CardContent>
      </Card>
    </div>
    {/* Show all products with quantity and last editor */}
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">All Products</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-3">Name</th>
              <th className="text-left py-2 px-3">Quantity</th>
              <th className="text-left py-2 px-3">Last Edited By</th>
              <th className="text-left py-2 px-3">Location</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td className="py-2 px-3">{p.name}</td>
                <td className="py-2 px-3">{p.quantity}</td>
                <td className="py-2 px-3">{p.updated_by || '-'}</td>
                <td className="py-2 px-3">{p.locations?.location || p.location || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
};
