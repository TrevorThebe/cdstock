import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

interface ProductFormProps {
  product: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stock_quantity: 0,
    min_quantity: 0,
    price: 0,
    location_id: ''
  });
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .order('Location', { ascending: true });

        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load locations',
          variant: 'destructive'
        });
      }
    };
    fetchLocations();
  }, []);

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        stock_quantity: product.stock_quantity,
        min_quantity: product.min_quantity,
        price: product.price,
        location_id: product.location_id
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['stock_quantity', 'min_quantity', 'price'].includes(name) 
        ? Number(value) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }
      if (formData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }

      // Prepare update data
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      let error;
      
      if (product?.id) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', product.id);
        error = updateError;
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert(updateData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: product ? 'Product updated!' : 'Product created!'
      });
      onSuccess();

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive'
      });
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{product ? 'Edit Product' : 'Add Product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock Quantity *</Label>
                <Input
                  name="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label>Min Quantity *</Label>
                <Input
                  name="min_quantity"
                  type="number"
                  min="0"
                  value={formData.min_quantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Price (R) *</Label>
              <Input
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label>Location *</Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.Location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : product ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
