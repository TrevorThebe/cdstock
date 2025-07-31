// hooks/useAdminAccess.ts
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';

export function useAdminAccess() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'super') {
      router.push('/unauthorized');
    }
  }, [user, router]);

  return {
    isAdmin: user?.role === 'admin',
    isSuper: user?.role === 'super'
  };
}