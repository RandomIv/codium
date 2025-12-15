import { LoginDto, RegisterDto } from '@/types/dto';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const loginUser = async (payload: LoginDto) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }

  return res.json();
};

export const registerUser = async (payload: RegisterDto) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Registration failed');
  }

  return res.json();
};

export const fetchUserProfile = async (): Promise<User | null> => {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return null;
    }
    throw new Error('Failed to fetch profile');
  }

  return res.json();
};
