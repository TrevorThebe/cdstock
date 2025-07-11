import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  min_quantity: number;
  locations: {
    id: string;
    location: string;
  } | null;
}

export const ProductListByLocation: React.FC<{ locationName: string }> = ({ locationName }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      setDebugInfo(null);

      try {
        // Debug: Verify Supabase connection
        console.log('Fetching products for location:', locationName);

        // Step 1: Get the location ID
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('id')
          .ilike('location', `%${locationName}%`)
          .single();

        if (locationError || !locationData) {
          throw new Error(`location "${locationName}" not found`);
        }

        // Step 2: Get products for this location
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            locations (
              id,
              location
            )
          `)
          .eq('location', locationData.id)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        console.log('Fetched products:', productsData);
        setProducts(productsData || []);
        setDebugInfo({
          locationId: locationData.id,
          productCount: productsData?.length || 0
        });

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProducts([]);
        setDebugInfo({
          error: err instanceof Error ? err.message : String(err)
        });
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
      <div className="p-6 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading {locationName} products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-center text-red-500">
          Error loading products: {error}
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mx-auto"
        >
          Retry
        </Button>
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-sm">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
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

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            {products.length === 0
              ? `No products available in ${locationName}`
              : `No products match your search in ${locationName}`}
          </p>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md text-sm max-w-md mx-auto">
              <h3 className="font-medium mb-2">Debug Info:</h3>
              <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 text-sm text-muted-foreground">
                    {product.description}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="font-medium">Quantity:</span> {product.stock_quantity}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> R{product.price}
                    </div>
                    <div>
                      <span className="font-medium">Min Qty:</span> {product.min_quantity}
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {product.locations?.location_id || 'No Location'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md text-sm">
              <h3 className="font-medium mb-2">Debug Info:</h3>
              <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};