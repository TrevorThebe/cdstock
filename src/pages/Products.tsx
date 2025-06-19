import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, User } from '@/types';
import { Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '@/lib/database';
import { authService } from '@/lib/auth';

interface ProductsProps {
  onEditProduct: (product: Product) => void;
}

export const Products: React.FC<ProductsProps> = ({ onEditProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    setCurrentUser(authService.getCurrentUser());
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await databaseService.getProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super')) {
      toast({ title: 'Error', description: 'Only admins can delete products', variant: 'destructive' });
      return;
    }
    
    try {
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      toast({ title: 'Success', description: 'Product deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const handleQuantityUpdate = async (product: Product, newQuantity: number) => {
    try {
      const updatedProduct = { ...product, quantity: newQuantity, updatedAt: new Date().toISOString() };
      await databaseService.saveProduct(updatedProduct);
      setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
      toast({ title: 'Success', description: 'Quantity updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update quantity', variant: 'destructive' });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'restaurant') return matchesSearch && product.location === 'restaurant';
    if (activeTab === 'bakery') return matchesSearch && product.location === 'bakery';
    if (activeTab === 'low-stock') return matchesSearch && product.quantity <= product.minQuantity;
    
    return matchesSearch;
  });

  const getTotalValue = (productList: Product[]) => {
    return productList.reduce((total, product) => total + (product.price * product.quantity), 0).toFixed(2);
  };

  const restaurantProducts = products.filter(p => p.location === 'restaurant');
  const bakeryProducts = products.filter(p => p.location === 'bakery');

  const canEditAll = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super');

  const ProductCard = ({ product }: { product: Product }) => {
    const isLowStock = product.quantity <= product.minQuantity;
    const [editingQuantity, setEditingQuantity] = useState(false);
    const [newQuantity, setNewQuantity] = useState(product.quantity);
    
    return (
      <Card className={`${isLowStock ? 'border-red-200 bg-red-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base lg:text-lg truncate">{product.name}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">{product.description}</CardDescription>
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => onEditProduct(product)} className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3">
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:ml-2 sm:inline">Edit</span>
              </Button>
              {canEditAll && (
                <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3">
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:ml-2 sm:inline">Delete</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Quantity:</span>
            <div className="flex items-center space-x-2">
              {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
              {editingQuantity ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    className="w-20 h-8"
                  />
                  <Button size="sm" onClick={() => {
                    handleQuantityUpdate(product, newQuantity);
                    setEditingQuantity(false);
                  }}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setNewQuantity(product.quantity);
                    setEditingQuantity(false);
                  }}>Cancel</Button>
                </div>
              ) : (
                <span 
                  className={`font-medium cursor-pointer ${isLowStock ? 'text-red-600' : ''}`}
                  onClick={() => setEditingQuantity(true)}
                >
                  {product.quantity}
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price:</span>
            <span className="font-medium">${product.price}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Value:</span>
            <span className="font-medium">${(product.price * product.quantity).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <Badge variant={product.location === 'restaurant' ? 'default' : 'secondary'} className="text-xs">{product.location}</Badge>
            {isLowStock && <Badge variant="destructive" className="text-xs">Low Stock</Badge>}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Products</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Products Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">${getTotalValue(products)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Restaurant Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">${getTotalValue(restaurantProducts)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bakery Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">${getTotalValue(bakeryProducts)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">All ({products.length})</TabsTrigger>
          <TabsTrigger value="restaurant" className="text-xs sm:text-sm px-2 py-2">Restaurant ({restaurantProducts.length})</TabsTrigger>
          <TabsTrigger value="bakery" className="text-xs sm:text-sm px-2 py-2">Bakery ({bakeryProducts.length})</TabsTrigger>
          <TabsTrigger value="low-stock" className="text-xs sm:text-sm px-2 py-2">Low Stock ({products.filter(p => p.quantity <= p.minQuantity).length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map(product => (<ProductCard key={product.id} product={product} />))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};