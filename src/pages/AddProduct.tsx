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
    location: 'restaurant' as 'restaurant' | 'bakery' // Changed default from 'locations' to 'restaurant'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name,
        description: editProduct.description,
        quantity: editProduct.stock_quantity?.toString() ?? '',
        minQuantity: editProduct.min_quantity?.toString() ?? '',
        price: editProduct.price?.toString() ?? '',
        location: editProduct.location as 'restaurant' | 'bakery' // Added type assertion
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
      // Validate numeric fields
      if (isNaN(parseInt(formData.quantity)) {
        throw new Error('Quantity must be a number');
      }
      if (isNaN(parseInt(formData.minQuantity))) {
        throw new Error('Minimum quantity must be a number');
      }
      if (isNaN(parseFloat(formData.price))) {
        throw new Error('Price must be a number');
      }

      const productData = {
        id: editProduct?.id || uuidv4(),
        name: formData.name,
        description: formData.description,
        stock_quantity: parseInt(formData.quantity),
        min_quantity: parseInt(formData.minQuantity),
        price: parseFloat(formData.price),
        location: formData.location,
        created_at: editProduct?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await databaseService.saveProduct(productData);
      toast({ 
        title: 'Success', 
        description: `Product ${editProduct ? 'updated' : 'added'} successfully`,
        variant: 'default'
      });
      onProductSaved();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive' 
      });
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
              <Label htmlFor="name">Product Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
                minLength={2}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Current Quantity *</Label>
                <Input 
                  id="quantity" 
                  name="quantity" 
                  type="number" 
                  min="0"
                  value={formData.quantity} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="minQuantity">Minimum Quantity *</Label>
                <Input 
                  id="minQuantity" 
                  name="minQuantity" 
                  type="number" 
                  min="0"
                  value={formData.minQuantity} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                step="0.01" 
                min="0"
                value={formData.price} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Select 
                value={formData.location} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, location: value as 'restaurant' | 'bakery' }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bakery">Bakery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 pt-4">
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