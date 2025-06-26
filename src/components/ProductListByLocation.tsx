import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const ProductListByLocation: React.FC<{ locationName: string }> = ({ locationName }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First get the location ID that matches the locationName
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('id')
          .ilike('Location', locationName)
          .single();

        if (locationError) throw locationError;
        if (!locationData) {
          setProducts([]);
          return;
        }

        // Then get products for this location
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            locations (
              id,
              Location
            )
          `)
          .eq('location_id', locationData.id)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [locationName]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading products: {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">{locationName} Products</h1>
        <div className="relative w-full sm:w-64">
          <Input
            placeholder={`Search ${locationName} products...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-4"
          />
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {products.length === 0 
            ? `No products available in ${locationName}`
            : `No products match your search in ${locationName}`}
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
