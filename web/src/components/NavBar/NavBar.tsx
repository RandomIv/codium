'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { List, Settings, User, LogOut } from 'lucide-react'; // Додали іконку LogOut
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types/enums';

export default function NavBar() {
  const pathname = usePathname();

  const { user, logout } = useAuthStore();

  const navItems = [
    { href: '/problems', icon: List, label: 'Problems', isAdmin: false },
    { href: '/profile', icon: User, label: 'Profile', isAdmin: false },
    {
      href: '/admin/problems/create',
      icon: Settings,
      label: 'Admin',
      isAdmin: true,
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        if (item.isAdmin && user?.role !== Role.ADMIN) return null;

        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted',
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {user && (
        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium',
            'text-destructive hover:bg-muted hover:cursor-pointer text-left',
          )}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      )}
    </nav>
  );
}
