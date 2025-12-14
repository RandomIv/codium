import Link from 'next/link';
import { Home } from 'lucide-react';
import NavBar from '@/components/NavBar/NavBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-card border-r border-border p-6 space-y-8">
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
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}
