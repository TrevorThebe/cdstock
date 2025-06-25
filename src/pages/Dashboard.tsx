import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  min_quantity: number;
  price: number;
  location: string;
  locations: { Location: string } | null;
}

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  restaurantItems: number;
  bakeryItems: number;
  totalValue: number;
  restaurantValue: number;
  bakeryValue: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
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
      // Fetch products with their location data
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          stock_quantity,
          min_quantity,
          price,
          id,
          locations:id (Location)
        `);

      if (error) throw error;

      // Process products data
      const processedProducts = (products || []).map((product: Product) => ({
        ...product,
        location: product.locations?.Location?.toLowerCase() || '',
      }));

      // Calculate statistics
      const restaurantProducts = processedProducts.filter(p => p.location === 'restaurant');
      const bakeryProducts = processedProducts.filter(p => p.Lcation === 'bakery');
      const lowStockProducts = processedProducts.filter(p => p.stock_quantity <= p.min_quantity);

      const calculateTotalValue = (items: typeof processedProducts) => 
        items.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock_quantity) || 0, 0);

      setStats({
        totalProducts: processedProducts.length,
        lowStockItems: lowStockProducts.length,
        restaurantItems: restaurantProducts.length,
        bakeryItems: bakeryProducts.length,
        totalValue: calculateTotalValue(processedProducts),
        restaurantValue: calculateTotalValue(restaurantProducts),
        bakeryValue: calculateTotalValue(bakeryProducts),
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Total Products" 
          value={stats.totalProducts} 
        />
        <DashboardCard 
          title="Low Stock Items" 
          value={stats.lowStockItems} 
          highlight={stats.lowStockItems > 0}
        />
        <DashboardCard 
          title="Restaurant Items" 
          value={stats.restaurantItems} 
        />
        <DashboardCard 
          title="Bakery Items" 
          value={stats.bakeryItems} 
        />
        <DashboardCard 
          title="Total Inventory Value" 
          value={`$${stats.totalValue.toFixed(2)}`} 
        />
        <DashboardCard 
          title="Restaurant Value" 
          value={`$${stats.restaurantValue.toFixed(2)}`} 
        />
        <DashboardCard 
          title="Bakery Value" 
          value={`$${stats.bakeryValue.toFixed(2)}`} 
        />
      </div>
    </div>
  );
};

// Helper component for dashboard cards
const DashboardCard: React.FC<{
  title: string;
  value: string | number;
  highlight?: boolean;
}> = ({ title, value, highlight = false }) => {
  return (
    <Card className={highlight ? 'border-red-500 border-2' : ''}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? 'text-red-500' : ''}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
};