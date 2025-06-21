import { useEffect, useState } from 'react';

const LOCAL_KEY = 'products';

export function useProducts(api: {
  fetchProducts: () => Promise<any[]>;
  saveProduct: (product: any) => Promise<void>;
}) {
  const [products, setProducts] = useState<any[]>([]);

  // Load from localStorage and then from server
  useEffect(() => {
    const local = localStorage.getItem(LOCAL_KEY);
    if (local) setProducts(JSON.parse(local));
    api.fetchProducts().then(serverProducts => {
      setProducts(serverProducts);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(serverProducts));
    });
  }, []);

  // Add/update product
  const saveProduct = async (product: any) => {
    const updated = [...products.filter(p => p.id !== product.id), product];
    setProducts(updated);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    await api.saveProduct(product);
  };

  return { products, saveProduct };
}
