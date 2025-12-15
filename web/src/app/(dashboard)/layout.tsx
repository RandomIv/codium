'use client';

import Link from 'next/link';
import { Home, Menu } from 'lucide-react';
import NavBar from '@/components/NavBar/NavBar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const Sidebar = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link href="/" className="block group">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">
                Codium
              </h2>
              <p className="text-xs text-muted-foreground">Back to Home</p>
            </div>
          </div>
        </Link>
        <div className="h-px bg-border" />
      </div>
      <NavBar />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-card border-r border-border p-6">
        <Sidebar />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border p-4">
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-extrabold text-foreground">Codium</h2>
          </Link>
        </div>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 rounded-r-lg rounded-l-none h-16 w-8 shadow-lg"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-card p-6">
          <div onClick={() => setIsOpen(false)}>
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>
      <main className="flex-1 md:pt-0 pt-16">{children}</main>
    </div>
  );
}
