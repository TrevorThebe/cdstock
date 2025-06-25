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

interface Location {
  id: string;
  Location: string;
}

export const AddProduct: React.FC<AddProductProps> = ({ editProduct, onProductSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    minQuantity: '',
    price: '',
    location_id: '' // Changed from location to location_id
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const { toast } = useToast();

  // Load locations from database
  useEffect(() => {
    const loadLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const { data, error } = await databaseService.getLocations();
        if (error) throw error;
        setLocations(data || []);
        
        // Set default location if available
        if (data?.length) {
          setFormData(prev => ({ ...prev, location_id: data[0].id }));
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load locations',
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
        name: editProduct.name,
        description: editProduct.description,
        quantity: editProduct.stock_quantity?.toString() ?? '',
        minQuantity: editProduct.min_quantity?.toString() ?? '',
        price: editProduct.price?.toString() ?? '',
        location_id: editProduct.location_id // Use location_id instead of location
      });
    }
  }, [editProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location_id) {
      toast({
        title: 'Error',
        description: 'Please select a location',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const productData = {
        id: editProduct?.id || uuidv4(),
        name: formData.name,
        description: formData.description,
        stock_quantity: parseInt(formData.quantity),
        min_quantity: parseInt(formData.minQuantity),
        price: parseFloat(formData.price),
        location_id: formData.location_id, // Save location_id instead of location name
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
                value={formData.location_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
                disabled={isLoadingLocations}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingLocations ? "Loading locations..." : "Select location"} />
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
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading || isLoadingLocations}>
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