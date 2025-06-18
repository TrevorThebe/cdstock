import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  Home,
  Package,
  Users,
  Settings,
  LogOut,
  Plus,
  BarChart3,
  Bell,
  ChefHat,
  Coffee,
  MessageCircle,
  Lock
} from 'lucide-react';
import { User } from '@/types';

interface SidebarProps {
  currentUser: User | null;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  onViewChange,
  onLogout,
  className
}) => {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      loadNotificationCount();
      const interval = setInterval(loadNotificationCount, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadNotificationCount = async () => {
    if (!currentUser) return;
    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', currentUser.id);
      
      const { data: readNotifications } = await supabase
        .from('read_notifications')
        .select('notification_id')
        .eq('user_id', currentUser.id);
      
      const readIds = readNotifications?.map(r => r.notification_id) || [];
      const unreadCount = (notifications || []).filter(n => !readIds.includes(n.id)).length;
      setNotificationCount(unreadCount);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'products', label: 'All Products', icon: Package },
    { id: 'restaurant', label: 'Restaurant', icon: ChefHat },
    { id: 'bakery', label: 'Bakery', icon: Coffee },
    { id: 'add-product', label: 'Add Product', icon: Plus },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
    { id: 'profile', label: 'Profile', icon: Settings },
    { id: 'update-password', label: 'Update Password', icon: Lock },
  ];

  const adminItems = [
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'users', label: 'Admin Panel', icon: BarChart3 },
  ];

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super';

  return (
    <div className={cn('flex flex-col h-full bg-white border-r shadow-sm', className)}>
      <div className="p-4 lg:p-6 border-b">
        <h2 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          CD Stock
        </h2>
      </div>
      
      <nav className="flex-1 px-2 lg:px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? 'default' : 'ghost'}
              className="w-full justify-start text-sm lg:text-base h-10 lg:h-11 relative"
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge className="ml-auto h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
        
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs text-muted-foreground font-medium px-2 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm lg:text-base h-10 lg:h-11"
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              );
            })}
          </>
        )}
      </nav>
      
      <div className="p-2 lg:p-4 border-t bg-gray-50/50">
        {currentUser && (
          <div className="mb-3 p-2 lg:p-3 bg-white rounded-lg border">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            <p className="text-xs text-blue-600 font-medium capitalize">{currentUser.role}</p>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full text-sm h-10"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};