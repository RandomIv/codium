'use client';

import Link from 'next/link';
import { List, Settings, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/problems',
      icon: List,
      label: 'Problems',
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
    },
    {
      href: '/admin/problems/create',
      icon: Settings,
      label: 'Admin',
    },
  ];

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
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
    </nav>
  );
}
