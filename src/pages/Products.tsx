import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase'; // Make sure supabase client is imported

export const Products: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'restaurant' | 'bakery'>('all');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          location (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && product.location?.name?.toLowerCase() === activeTab;
  });

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      ...product,
      location: product.location || '',
    });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'min_quantity' || name === 'price'
        ? Number(value)
        : value
    }));
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const updatedProduct: any = {
        id: editingProduct.id,
        name: editForm.name ?? editingProduct.name,
        description: editForm.description ?? editingProduct.description,
        price: editForm.price ?? editingProduct.price,
        stock_quantity: editForm.quantity !== undefined ? editForm.quantity : editingProduct.quantity,
        min_quantity: editForm.min_quantity !== undefined
          ? editForm.min_quantity
          : editingProduct.min_quantity,
        location: editForm.location ?? editingProduct.location,
      };

      const { error } = await supabase
        .from('products')
        .upsert(updatedProduct);

      if (error) throw error;

      await loadProducts();
      setEditingProduct(null);
    } catch (error) {
      // Handle error as needed
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Products</h1>
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-4"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
        >All</Button>
        <Button
          variant={activeTab === 'restaurant' ? 'default' : 'outline'}
          onClick={() => setActiveTab('restaurant')}
        >Restaurant</Button>
        <Button
          variant={activeTab === 'bakery' ? 'default' : 'outline'}
          onClick={() => setActiveTab('bakery')}
        >Bakery</Button>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No products found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">{product.description}</div>
              <div className="mb-2">Quantity: {product.stock_quantity}</div>
              <div className="mb-2">Price: R{product.price}</div>
              <Badge className="text-xs">
                {product.location?.name || 'Unknown Location'}
              </Badge>
              <div className="mb-2">Min Quantity: {product.min_quantity}</div>
              <div className="mt-2">
                <Button size="sm" onClick={() => handleEditProduct(product)}>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            <form onSubmit={handleEditFormSubmit} className="space-y-4">
              {/* ...inputs as before... */}
              {/* You may want to update your location selection to show human-readable location names */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};