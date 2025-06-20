import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '@/lib/database';
import { Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AddProductProps {
  editProduct?: Product | null;
  onProductSaved: () => void;
}

export const AddProduct: React.FC<AddProductProps> = ({ editProduct, onProductSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    minQuantity: '',
    price: '',
    location: 'restaurant' as 'restaurant' | 'bakery'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name,
        description: editProduct.description,
        quantity: editProduct.quantity.toString(),
        minQuantity: editProduct.minQuantity.toString(),
        price: editProduct.price.toString(),
        location: editProduct.location
      });
    }
  }, [editProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productData: Product = {
        id: editProduct?.id || uuidv4(),
        name: formData.name,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        minQuantity: parseInt(formData.minQuantity),
        price: parseFloat(formData.price),
        location: formData.location,
        createdAt: editProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await databaseService.saveProduct(productData);
      toast({ title: 'Success', description: `Product ${editProduct ? 'updated' : 'added'} successfully` });
      onProductSaved();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="minQuantity">Min Quantity</Label>
                <Input id="minQuantity" name="minQuantity" type="number" value={formData.minQuantity} onChange={handleInputChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value as 'restaurant' | 'bakery' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bakery">Bakery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
              </Button>
              <Button type="button" variant="outline" onClick={onProductSaved}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};