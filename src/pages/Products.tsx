import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  min_quantity: number;
  location: string;
  locations?: {
    id: string;
    location: string;
  };
}

interface Location {
  id: string;
  location: string;
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'restaurant' | 'bakery'>('all');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    min_quantity: 0,
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    loadLocations();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          locations (
            id,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    // Compare tab with location name (case-insensitive)
    return (
      matchesSearch &&
      product.locations?.location?.toLowerCase() === activeTab
    );
  });

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity,
      min_quantity: product.min_quantity,
      location: product.locations?.id || product.location,
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

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editForm.name,
          description: editForm.description,
          price: editForm.price,
          quantity: editForm.quantity,
          min_quantity: editForm.min_quantity,
          location: editForm.location,
        })
        .eq('id', editForm.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });

      await loadProducts();
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
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
              <div className="mb-2">Quantity: {product.quantity}</div>
              <Badge className="text-xs mb-2">
                {product.locations?.location || 'Unknown Location'}
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

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            <form onSubmit={handleEditFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <Input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                <Input
                  name="quantity"
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Quantity</label>
                <Input
                  name="min_quantity"
                  type="number"
                  min="0"
                  value={editForm.min_quantity}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <select
                  name="location"
                  value={editForm.location}
                  onChange={handleEditFormChange}
                  required
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select a location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.location}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};