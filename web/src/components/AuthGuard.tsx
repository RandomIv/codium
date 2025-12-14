'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Role } from '@/types/enums';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    const guestRoutes = ['/login', '/register'];
    const adminRoutesPrefix = '/admin';
    const publicRoutes = ['/'];

    if (!token) {
      if (!guestRoutes.includes(pathname) && !publicRoutes.includes(pathname)) {
        router.push('/login');
        return;
      }
    }

    if (token && user) {
      if (guestRoutes.includes(pathname)) {
        router.push('/problems');
        return;
      }

      if (pathname.startsWith(adminRoutesPrefix) && user.role !== Role.ADMIN) {
        router.push('/problems');
        return;
      }
    }

    setIsChecking(false);
  }, [isAuthenticated, token, user, router, pathname, _hasHydrated]);

  if (isChecking || !_hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
