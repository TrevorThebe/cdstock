import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { databaseService } from '@/lib/database';
import { Product } from '@/types';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'restaurant' | 'bakery'>('all');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await databaseService.getProducts();
      const mappedProducts = allProducts.map((p: any) => ({
        ...p,
        quantity: p.stock_quantity,
        min_quantity: p.min_quantity,
      }));
      setProducts(mappedProducts);
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
    return matchesSearch && product.location === activeTab;
  });

  const handleEditProduct = (product: Product) => {
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
      // Prepare payload for Supabase (snake_case for min_quantity)
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
      // Debug: log payload
      // console.log('Saving product:', updatedProduct);
      await databaseService.saveProduct(updatedProduct);
      setProducts(prev =>
        prev.map(p =>
          p.id === updatedProduct.id
            ? { ...updatedProduct, quantity: updatedProduct.stock_quantity }
            : p
        )
      );
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
        >
          All
        </Button>
        <Button
          variant={activeTab === 'restaurant' ? 'default' : 'outline'}
          onClick={() => setActiveTab('restaurant')}
        >
          Restaurant
        </Button>
        <Button
          variant={activeTab === 'bakery' ? 'default' : 'outline'}
          onClick={() => setActiveTab('bakery')}
        >
          Bakery
        </Button>
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
              <div className="mb-2">Price: R{product.price}</div>
              <Badge className="text-xs">{product.location}</Badge>
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
              <Input
                name="name"
                placeholder="Product Name"
                value={editForm.name ?? editingProduct.name}
                onChange={handleEditFormChange}
                required
              />
              <Input
                name="description"
                placeholder="Description"
                value={editForm.description ?? editingProduct.description}
                onChange={handleEditFormChange}
                required
              />
              <Input
                name="quantity"
                type="number"
                placeholder="Quantity"
                value={
                  editForm.quantity !== undefined && editForm.quantity !== null
                    ? editForm.quantity
                    : editingProduct.quantity
                }
                onChange={handleEditFormChange}
                required
              />
              <Input
                name="min_quantity"
                type="number"
                placeholder="Min Quantity"
                value={
                  editForm.min_quantity !== undefined && editForm.min_quantity !== null
                    ? editForm.min_quantity
                    : editingProduct.min_quantity
                }
                onChange={handleEditFormChange}
                required
              />
              <Input
                name="price"
                type="number"
                placeholder="Price"
                value={
                  editForm.price !== undefined && editForm.price !== null
                    ? editForm.price
                    : editingProduct.price
                }
                onChange={handleEditFormChange}
                required
              />
              <select
                name="location"
                value={editForm.location ?? editingProduct.location ?? ''}
                onChange={handleEditFormChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select a location...</option>
                <option value="restaurant">Restaurant</option>
                <option value="bakery">Bakery</option>
              </select>
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