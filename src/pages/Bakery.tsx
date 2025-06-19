import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle } from 'lucide-react';
import { databaseService } from '@/lib/database';
import { Product } from '@/types';

export const Bakery: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await databaseService.getProducts();
      setProducts(allProducts.filter(p => p.location === 'bakery'));
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalValue = (productList: Product[]) => {
    return productList.reduce((total, product) => total + (product.price * product.quantity), 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Bakery Inventory</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Bakery Total Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-purple-600">${getTotalValue(filteredProducts)}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map(product => {
          const isLowStock = product.quantity <= product.minQuantity;
          const totalValue = (product.price * product.quantity).toFixed(2);
          return (
            <Card key={product.id} className={isLowStock ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quantity:</span>
                  <div className="flex items-center space-x-2">
                    {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    <span className={isLowStock ? 'text-red-600 font-medium' : 'font-medium'}>
                      {product.quantity}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Price:</span>
                  <span className="font-medium">${product.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Value:</span>
                  <span className="font-medium">${totalValue}</span>
                </div>
                {isLowStock && <Badge variant="destructive" className="text-xs">Low Stock</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No bakery products found.</p>
        </div>
      )}
    </div>
  );
};