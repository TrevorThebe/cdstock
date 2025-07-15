import React, { useEffect, useState } from 'react';



import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import { Badge } from '@/components/ui/badge';


import { supabase } from '@/lib/supabase';





export const ProductListByLocation: React.FC<{ locationName: string }> = ({ locationName }) => {


  const [products, setProducts] = useState<any[]>([]);


  const [loading, setLoading] = useState(true);





  useEffect(() => {


    const fetchProducts = async () => {


      setLoading(true);


      const { data, error } = await supabase


        .from('products')


        .select(`


          *,


          locations (


            id,


            Location


          )


        `)


        .order('created_at', { ascending: false });





      if (!error) {


        setProducts(


          (data || []).filter(


            (p: any) => p.locations?.Location?.toLowerCase() === locationName.toLowerCase()


          )


        );


      }


      setLoading(false);


    };


    fetchProducts();


  }, [locationName]);





  if (loading) {


    return <div className="p-6 text-center">Loading...</div>;


  }





  if (products.length === 0) {


    return <div className="p-6 text-center text-muted-foreground">No products found for {locationName}.</div>;


  }





  return (


    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">


      {products.map(product => (


        <Card key={product.id}>


          <CardHeader>


            <CardTitle>{product.name}</CardTitle>


          </CardHeader>


          <CardContent>


            <div className="mb-2">{product.description}</div>


            <div className="mb-2">Quantity: {product.stock_quantity}</div>


            <div className="mb-2">Price: R{product.price}</div>


            <Badge className="text-xs">{product.locations?.Location || 'Unknown Location'}</Badge>


            <div className="mb-2">Min Quantity: {product.min_quantity}</div>


          </CardContent>


        </Card>


      ))}


    </div>


  );


};