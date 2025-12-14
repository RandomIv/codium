import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NavBarSection() {
  return (
    <Link
      href="/"
      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-foreground"
    >
      <Home className="w-5 h-5" />
      <span className="font-medium">Home</span>
    </Link>
  );
}
