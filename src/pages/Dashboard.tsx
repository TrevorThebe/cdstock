
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
    bakeryValue: 0,
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
            type
          )
        `);

      if (error) throw error;

      const mappedProducts = (data ?? []).map((p: any) => ({
        ...p,
        quantity: Number(p.quantity),
        min_quantity: Number(p.min_quantity),
        price: Number(p.price),
        locationType: (p.locations?.type ?? '').trim().toLowerCase(),
      }));

      const restaurantProducts = mappedProducts.filter(p =>
        p.locationType === 'restaurant'
      );

      const bakeryProducts = mappedProducts.filter(p =>
        p.locationType === 'bakery'
      );

      const lowStock = mappedProducts.filter(
        p => p.quantity <= p.min_quantity
      );

      const totalValue = mappedProducts.reduce(
        (sum, p) => sum + (p.price * p.quantity),
        0
      );

      const restaurantValue = restaurantProducts.reduce(
        (sum, p) => sum + (p.price * p.quantity),
        0
      );

      const bakeryValue = bakeryProducts.reduce(
        (sum, p) => sum + (p.price * p.quantity),
        0
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
      console.error('Error loading data:', error);
      setProducts([]);
      setStats({
        totalProducts: 0,
        lowStockItems: 0,
        restaurantItems: 0,
        bakeryItems: 0,
        totalValue: 0,
        restaurantValue: 0,
        bakeryValue: 0,
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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">🔍 Debug: Mapped Location Types</h2>
        <ul className="list-disc pl-6 text-gray-700">
          {products.map((p, index) => (
            <li key={index}>{p.locationType || '(empty)'}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
