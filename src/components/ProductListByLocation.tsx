import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

export const ProductListByLocation: React.FC<{ locationName: string }> = ({ locationName }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, get the location ID that matches the locationName
        const { data: location, error: locationError } = await supabase
          .from('locations')
          .select('id')
          .eq('Location', locationName)
          .single();

        if (locationError || !Location) {
          throw new Error(locationError?.message || 'Location not found');
        } 

        // Then get products that reference this location ID
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            locations!inner (
              id,
              Location
            )
          `)
          .eq('location', location.Location)  // This matches the foreign key in products
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        console.log('Fetched products:', productsData);
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

  // ... rest of your component remains the same ...
};