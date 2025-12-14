'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import AuthCard from '../_components/AuthCard';
import { useRegister } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { mutate: register, isPending, error: serverError } = useRegister();

  const [validationError, setValidationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const { confirmPassword, ...dataToSend } = formData;
    register(dataToSend);
  };

  const errorDisplay = validationError || serverError?.message;

  return (
    <AuthCard
      title="Create Account"
      description="Join us to start solving problems"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorDisplay && (
          <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm font-bold text-center border border-destructive/20">
            {errorDisplay}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Username</Label>
          <Input
            id="name"
            placeholder="johndoe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="bg-muted"
          />
        </div>

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
          <Label htmlFor="password">Password</Label>
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
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
          Sign Up
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-2">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary hover:underline font-bold transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
