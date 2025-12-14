'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import AuthCard from '../_components/AuthCard';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const { mutate: login, isPending, error } = useLogin();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <AuthCard
      title="Welcome Back"
      description="Enter your credentials to access your account"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm font-bold text-center border border-destructive/20">
            {error.message}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {/* Можна додати лінк Forgot password? */}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            className="bg-muted"
          />
        </div>

        <Button
          disabled={isPending}
          type="submit"
          className="w-full font-bold hover:cursor-pointer"
        >
          {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
          Sign In
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-2">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-primary hover:underline font-bold transition-colors"
          >
            Register here
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
