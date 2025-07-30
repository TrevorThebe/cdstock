// File: pages/test-supabase.tsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestSupabase() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      console.log('Test connection results:', { data, error });
    }
    testConnection();
  }, []);

  return <div>Checking Supabase connection... (see browser console)</div>;
}