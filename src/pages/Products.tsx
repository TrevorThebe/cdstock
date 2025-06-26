import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'restaurant' | 'bakery'>('all');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

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
            Location_id
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

  const loadLocations = async () => {
    const { data, error } = await supabase.from('locations').select('*');
    if (!error) setLocations(data || []);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && product.locations?.location_id?.toLowerCase() === activeTab;
  });

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.stock_quantity,
      min_quantity: product.min_quantity,
      location_id: product.location_id, // this is the location id
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
      const updatedProduct = {
        id: editForm.id,
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        stock_quantity: editForm.quantity,
        min_quantity: editForm.min_quantity,
        location_id: editForm.location_id, // this is the location id
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
                {product.locations?.Location || 'Unknown Location'}
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
                <label>Name</label>
                <Input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label>Description</label>
                <Input
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                />
              </div>
              <div>
                <label>Price</label>
                <Input
                  name="price"
                  type="number"
                  value={editForm.price}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label>Quantity</label>
                <Input
                  name="quantity"
                  type="number"
                  value={editForm.quantity}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label>Min Quantity</label>
                <Input
                  name="min_quantity"
                  type="number"
                  value={editForm.min_quantity}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label>Location</label>
                <select
                  name="location"
                  value={editForm.location}
                  onChange={handleEditFormChange}
                  required
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select a location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.Location}
                    </option>
                  ))} 
                </select>
              </div>
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
