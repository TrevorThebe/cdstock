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

interface AddProductProps {
  editProduct?: Product | null;
  onProductSaved: () => void;
  onCancel: () => void;
}

export const AddProduct: React.FC<AddProductProps> = ({
  editProduct,
  onProductSaved,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stock_quantity: 0,
    min_quantity: 0,
    price: 0,
    location: ''
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const { toast } = useToast();

  // Load locations from database
  useEffect(() => {
    const loadLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .order('Location', { ascending: true });

        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        toast({
          title: 'Error loading locations',
          description: error instanceof Error ? error.message : 'Failed to fetch locations',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingLocations(false);
      }
    };

    loadLocations();
  }, []);

  // Initialize form with edit product data
  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name || '',
        description: editProduct.description || '',
        stock_quantity: editProduct.stock_quantity || 0,
        min_quantity: editProduct.min_quantity || 0,
        price: editProduct.price || 0,
        location_id: editProduct.location || (editProduct as any).location || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        stock_quantity: 0,
        min_quantity: 0,
        price: 0,
        location: ''
      });
    }
  }, [editProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock_quantity' || name === 'min_quantity' || name === 'price'
        ? Math.max(0, Number(value)) // Ensure non-negative numbers
        : value
    }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Product name is required',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Price must be greater than 0',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.location) {
      toast({
        title: 'Validation Error',
        description: 'Please select a location',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const productData = {
        id: editProduct?.id,
        name: formData.name,
        description: formData.description,
        stock_quantity: formData.stock_quantity,
        min_quantity: formData.min_quantity,
        price: formData.price,
        location: formData.location,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .upsert(productData, { onConflict: 'id' });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Product ${editProduct ? 'updated' : 'added'} successfully`,
      });

      if (!editProduct) {
        setFormData({
          name: '',
          description: '',
          stock_quantity: 0,
          min_quantity: 0,
          price: 0,
          location: ''
        });
      }

      onProductSaved();
    } catch (error) {
      console.error('Save error:', error);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset disabled={isLoading || isLoadingLocations} className="space-y-4">
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
                    <Label htmlFor="stock_quantity">Current Quantity *</Label>
                    <Input
                      id="stock_quantity"
                      name="stock_quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock_quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_quantity">Minimum Quantity *</Label>
                    <Input
                      id="min_quantity"
                      name="min_quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.min_quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">Price (R) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={handleLocationChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingLocations ? "Loading locations..." : "Select location"} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location}
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isLoading
                      ? (editProduct ? 'Updating...' : 'Adding...')
                      : (editProduct ? 'Update Product' : 'Add Products')}
                  </Button>
                </div>
              </fieldset>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
