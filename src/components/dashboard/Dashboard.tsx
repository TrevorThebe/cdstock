import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Package, Users, TrendingUp } from 'lucide-react';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Product, User, Notification } from '@/types';
import { toast } from '@/components/ui/use-toast';

export const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
    getCurrentUser();
    checkLowStock();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setCurrentUser({
            id: user.id,
            name: profile.name,
            email: user.email,
            role: profile.role,
            avatar_url: profile.avatar_url
          });
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      // Fallback to localStorage if Supabase fails
      setCurrentUser(storage.getCurrentUser());
    }
  };

  const loadData = () => {
    setProducts(storage.getProducts());
    setUsers(storage.getUsers());
    setNotifications(storage.getNotifications());
  };

  const checkLowStock = () => {
    const products = storage.getProducts();
    const lowStockProducts = products.filter(p => p.quantity <= 3);
    
    if (lowStockProducts.length > 0) {
      const notifications = storage.getNotifications();
      lowStockProducts.forEach(product => {
        const existingNotification = notifications.find(
          n => n.message.includes(product.name) && n.type === 'low-stock'
        );
        
        if (!existingNotification) {
          const notification: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            message: `Low stock alert: ${product.name} (${product.quantity} remaining)`,
            type: 'low-stock',
            read: false,
            createdAt: new Date().toISOString()
          };
          notifications.push(notification);
        }
      });
      storage.saveNotifications(notifications);
      setNotifications(notifications);
    }
  };

  const restaurantProducts = products.filter(p => p.location === 'restaurant');
  const bakeryProducts = products.filter(p => p.location === 'bakery');
  const lowStockCount = products.filter(p => p.quantity <= 3).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          CD Stock Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge variant="destructive">{unreadNotifications}</Badge>
            )}
          </div>
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
      </div>

      {/* Stats Cards */}
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

      {/* Welcome Card */}
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