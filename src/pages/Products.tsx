import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product } from '@/types';
import { storage } from '@/lib/storage';
import { Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';

const api = {
  fetchProducts: () => fetch('/api/products').then(r => r.json()),
  saveProduct: (product: any) =>
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }),
};

export default function Products() {
  const { products, saveProduct } = useProducts(api);
  const [name, setName] = useState('');

  const handleAdd = async () => {
    const newProduct = { id: Date.now(), name };
    await saveProduct(newProduct);
    setName('');
  };

  return (
    <div>
      <h1>Products</h1>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Product name"
      />
      <button onClick={handleAdd}>Add Product</button>
      <ul>
        {products.map(p => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}

interface ProductsProps {
  onEditProduct: (product: Product) => void;
}

export const Products: React.FC<ProductsProps> = ({ onEditProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const allProducts = storage.getProducts();
    setProducts(allProducts);
  };

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    storage.saveProducts(updatedProducts);
    setProducts(updatedProducts);
    toast({
      title: 'Success',
      description: 'Product deleted successfully'
    });
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

  const ProductCard = ({ product }: { product: Product }) => {
    const isLowStock = product.quantity <= product.minQuantity;
    
    return (
      <Card className={`R{isLowStock ? 'border-red-200 bg-red-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base lg:text-lg truncate">{product.name}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">{product.description}</CardDescription>
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditProduct(product)}
                className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:ml-2 sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteProduct(product.id)}
                className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:ml-2 sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Quantity:</span>
            <div className="flex items-center space-x-2">
              {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
              <span className={`font-medium ${isLowStock ? 'text-red-600' : ''}`}>
                {product.quantity}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price:</span>
            <span className="font-medium">R{product.price}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <Badge variant={product.location === 'restaurant' ? 'default' : 'secondary'} className="text-xs">
              {product.location}
            </Badge>
            {isLowStock && (
              <Badge variant="destructive" className="text-xs">Low Stock</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Products2</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">
            All ({products.length})
          </TabsTrigger>
          <TabsTrigger value="restaurant" className="text-xs sm:text-sm px-2 py-2">
            Restaurant ({products.filter(p => p.location === 'restaurant').length})
          </TabsTrigger>
          <TabsTrigger value="bakery" className="text-xs sm:text-sm px-2 py-2">
            Bakery ({products.filter(p => p.location === 'bakery').length})
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="text-xs sm:text-sm px-2 py-2">
            Low Stock ({products.filter(p => p.quantity <= p.minQuantity).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
