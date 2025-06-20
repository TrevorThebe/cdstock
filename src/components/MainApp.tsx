import React, { useState, useEffect } from 'react';
import { AuthPage } from './auth/AuthPage';
import { Dashboard } from './dashboard/Dashboard';
import { Sidebar } from './layout/Sidebar';
import { Profile } from '@/pages/Profile';
import { Products } from '@/pages/Products';
import { AddProduct } from '@/pages/AddProduct';
import { Notifications } from '@/pages/Notifications';
import { Restaurant } from '@/pages/Restaurant';
import { Bakery } from '@/pages/Bakery';
import { Admin } from '@/pages/Admin';
import { Chat } from '@/pages/Chat';
import { UserManagement } from '@/pages/UserManagement';
import { authService } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { User, Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Toaster } from '@/components/ui/toaster';
import { Menu, X } from 'lucide-react';

export const MainApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = () => {
    const users = storage.getUsers();
    const products = storage.getProducts();
    
    if (users.length === 0) {
      const adminUser: User = {
        id: uuidv4(),
        email: 'admin@cdstock.com',
        name: 'Admin User',
        phone: '+1234567890',
        role: 'super',
        isBlocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      storage.saveUsers([adminUser]);
    }
    
    if (products.length === 0) {
      const sampleProducts: Product[] = [
        ...Array.from({ length: 10 }, (_, i) => ({
          id: uuidv4(),
          name: `Restaurant Item ${i + 1}`,
          description: `Description for restaurant item ${i + 1}`,
          quantity: Math.floor(Math.random() * 20) + 1,
          minQuantity: 3,
          price: Math.floor(Math.random() * 50) + 10,
          location: 'restaurant' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        ...Array.from({ length: 10 }, (_, i) => ({
          id: uuidv4(),
          name: `Bakery Item ${i + 1}`,
          description: `Description for bakery item ${i + 1}`,
          quantity: Math.floor(Math.random() * 20) + 1,
          minQuantity: 3,
          price: Math.floor(Math.random() * 30) + 5,
          location: 'bakery' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      ];
      storage.saveProducts(sampleProducts);
    }
    
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);
  };

  const handleAuthSuccess = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  const handleEditProduct = (product: Product) => {
    setEditProduct(product);
    setActiveView('add-product');
  };

  const handleProductSaved = () => {
    setEditProduct(null);
    setActiveView('products');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const renderActiveView = () => {
    if (!currentUser) return null;

    switch (activeView) {
      case 'profile':
        return <Profile currentUser={currentUser} onUserUpdate={handleUserUpdate} />;
      case 'products':
        return <Products onEditProduct={handleEditProduct} />;
      case 'add-product':
        return <AddProduct editProduct={editProduct} onProductSaved={handleProductSaved} />;
      case 'notifications':
        return <Notifications />;
      case 'restaurant':
        return <Restaurant />;
      case 'bakery':
        return <Bakery />;
      case 'chat':
        return <Chat />;
      case 'user-management':
        return (currentUser.role === 'admin' || currentUser.role === 'super') ? 
          <UserManagement /> : <Dashboard />;
      case 'users':
        return (currentUser.role === 'admin' || currentUser.role === 'super') ? 
          <Admin currentUser={currentUser} /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <AuthPage onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}>
          <Sidebar
            currentUser={currentUser}
            activeView={activeView}
            onViewChange={(view) => {
              setActiveView(view);
              setSidebarOpen(false);
            }}
            onLogout={handleLogout}
          />
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">CD Stock</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
          
          {/* Page content */}
          <div className="flex-1 overflow-auto">
            {renderActiveView()}
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
};