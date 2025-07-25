import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Edit, Trash2, AlertTriangle, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  min_quantity: number;
  location_type: string;
  created_at: string;
  updated_at: string;
}

interface ProductsProps {
  onEditProduct?: (product: Product) => void;
}

export const Products: React.FC<ProductsProps> = ({ onEditProduct }) => {
  const { currentUser } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityUpdate = async (product: Product, change: number) => {
    const newQuantity = Math.max(0, (product.quantity || 0) + change);
    try {
      const { error } = await supabase
        .from('products')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', product.id);
      
      if (error) throw error;
      
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: newQuantity } : p));
      toast({ title: 'Success', description: 'Quantity updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update quantity', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super')) {
      toast({ title: 'Error', description: 'Only admins can delete products', variant: 'destructive' });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({ title: 'Success', description: 'Product deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'restaurant') return matchesSearch && product.location_type === 'restaurant';
    if (activeTab === 'bakery') return matchesSearch && product.location_type === 'bakery';
    if (activeTab === 'low-stock') return matchesSearch && (product.quantity || 0) <= (product.min_quantity || 0);
    
    return matchesSearch;
  });

  const restaurantCount = products.filter(p => p.location_type === 'restaurant').length;
  const bakeryCount = products.filter(p => p.location_type === 'bakery').length;
  const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.min_quantity || 0)).length;

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
        <h1 className="text-3xl font-bold">Products</h1>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search products..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({products.length})</TabsTrigger>
          <TabsTrigger value="restaurant">Restaurant ({restaurantCount})</TabsTrigger>
          <TabsTrigger value="bakery">Bakery ({bakeryCount})</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock ({lowStockCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              const isLowStock = (product.quantity || 0) <= (product.min_quantity || 0);
              return (
                <Card key={product.id} className={isLowStock ? 'border-red-200 bg-red-50' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {product.name}
                          {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </div>
                      <Badge variant={product.location_type === 'restaurant' ? 'default' : 'secondary'} className="capitalize">
                        {product.location_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQuantityUpdate(product, -1)}
                          disabled={(product.quantity || 0) <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className={`font-bold ${isLowStock ? 'text-red-600' : ''}`}>
                          {product.quantity || 0}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQuantityUpdate(product, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Price: ${product.price || 0}</span>
                      <span>Min: {product.min_quantity || 0}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {onEditProduct && (
                        <Button size="sm" variant="outline" onClick={() => onEditProduct(product)}>
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      )}
                      {(currentUser?.role === 'admin' || currentUser?.role === 'super') && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};