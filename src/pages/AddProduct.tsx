import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/types';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface AddProductProps {
  editProduct?: Product | null;
  onProductSaved: () => void;
}

export const AddProduct: React.FC<AddProductProps> = ({ editProduct, onProductSaved }) => {
  const [formData, setFormData] = useState({
    name: editProduct?.name || '',
    description: editProduct?.description || '',
    quantity: editProduct?.quantity?.toString() || '',
    minQuantity: editProduct?.minQuantity?.toString() || '3',
    price: editProduct?.price?.toString() || '',
    location: editProduct?.location || 'restaurant'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      location: value as 'restaurant' | 'bakery'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const products = storage.getProducts();
      const productData: Product = {
        id: editProduct?.id || uuidv4(),
        name: formData.name,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        minQuantity: parseInt(formData.minQuantity),
        price: parseFloat(formData.price),
        location: formData.location as 'restaurant' | 'bakery',
        createdAt: editProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedProducts;
      if (editProduct) {
        updatedProducts = products.map(p => p.id === editProduct.id ? productData : p);
      } else {
        updatedProducts = [...products, productData];
      }

      storage.saveProducts(updatedProducts);
      
      toast({
        title: 'Success',
        description: `Product ${editProduct ? 'updated' : 'added'} successfully`
      });

      if (!editProduct) {
        setFormData({
          name: '',
          description: '',
          quantity: '',
          minQuantity: '3',
          price: '',
          location: 'restaurant'
        });
      }
      
      onProductSaved();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editProduct ? 'update' : 'add'} product`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
          <CardDescription>
            {editProduct ? 'Update product information' : 'Add a new product to your inventory'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={formData.location} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity">Current Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="minQuantity">Minimum Quantity</Label>
                <Input
                  id="minQuantity"
                  name="minQuantity"
                  type="number"
                  value={formData.minQuantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="3"
                />
              </div>
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Saving...' : (editProduct ? 'Update Product' : 'Add Product')}
              </Button>
              {editProduct && (
                <Button type="button" variant="outline" onClick={onProductSaved}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};