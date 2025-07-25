import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Package, Users, TrendingUp } from 'lucide-react';
import { authService } from '@/lib/auth';
import { databaseService } from '@/lib/database';
import { Product, User } from '@/types';

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
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          CD Stock Dashboard
        </h1>
        {currentUser && (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
              <AvatarImage src={currentUser.avatar_url} />
              <AvatarFallback className="text-xs lg:text-sm">
                {currentUser.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium truncate max-w-32">{currentUser.name}</p>
              <Badge variant="outline" className="text-xs">
                {currentUser.role}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Total Products</CardTitle>
            <Package className="h-3 w-3 lg:h-4 lg:w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Restaurant Items</CardTitle>
            <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{restaurantProducts.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Bakery Items</CardTitle>
            <Package className="h-3 w-3 lg:h-4 lg:w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{bakeryProducts.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Low Stock</CardTitle>
            <Bell className="h-3 w-3 lg:h-4 lg:w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{lowStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {currentUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Avatar className="h-10 w-10 lg:h-12 lg:w-12">
                <AvatarImage src={currentUser.avatar_url} />
                <AvatarFallback>
                  {currentUser.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-lg lg:text-xl">Welcome back, {currentUser.name}!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="text-muted-foreground text-sm">
                Role: <Badge variant="outline">{currentUser.role}</Badge>
              </p>
              <p className="text-muted-foreground text-sm truncate">
                Email: {currentUser.email}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
