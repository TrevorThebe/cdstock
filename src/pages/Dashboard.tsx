import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Product, DashboardStats } from '@/types';

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
          location_id,
          locations (id, Location)
        `);

      if (error) throw error;

      // Process products data
      const processedProducts = (products || []).map((product) => ({
        ...product,
        location_name: product.locations?.Location?.toLowerCase() || '',
      }));

      // Calculate statistics
      const restaurantProducts = processedProducts.filter(p => p.location_name.includes('restaurant'));
      const bakeryProducts = processedProducts.filter(p => p.location_name.includes('bakery'));
      const lowStockProducts = processedProducts.filter(p => p.stock_quantity <= p.min_quantity);

      const calculateTotalValue = (items: typeof processedProducts) => 
        items.reduce((sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0), 0);

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
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon="📦"
        />
        <DashboardCard 
          title="Low Stock Items" 
          value={stats.lowStockItems} 
          highlight={stats.lowStockItems > 0}
          icon="⚠️"
        />
        <DashboardCard 
          title="Restaurant Items" 
          value={stats.restaurantItems} 
          icon="🍽️"
        />
        <DashboardCard 
          title="Bakery Items" 
          value={stats.bakeryItems} 
          icon="🥖"
        />
        <DashboardCard 
          title="Total Inventory Value" 
          value={`R${stats.totalValue.toFixed(2)}`} 
          icon="💰"
        />
        <DashboardCard 
          title="Restaurant Value" 
          value={`R${stats.restaurantValue.toFixed(2)}`} 
          icon="💵"
        />
        <DashboardCard 
          title="Bakery Value" 
          value={`R${stats.bakeryValue.toFixed(2)}`} 
          icon="💲"
        />
      </div>
    </div>
  );
};

// Enhanced Dashboard Card Component
const DashboardCard: React.FC<{
  title: string;
  value: string | number;
  highlight?: boolean;
  icon?: string;
}> = ({ title, value, highlight = false, icon }) => {
  return (
    <Card className={`${highlight ? 'border-red-500 border-2' : ''} hover:shadow-lg transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        {icon && <span className="text-xl">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? 'text-red-500' : 'text-gray-900'}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
};
