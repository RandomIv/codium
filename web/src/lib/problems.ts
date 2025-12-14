import { CreateSubmissionDto } from '@/types';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchProblems = async () => {
  const res = await fetch(`${API_URL}/problems`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch problems');
  return res.json();
};

export const fetchProblemById = async (id: string) => {
  const res = await fetch(`${API_URL}/problems/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch problem');
  return res.json();
};

export const fetchSubmissionById = async (id: string) => {
  const res = await fetch(`${API_URL}/submissions/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch submission');
  return res.json();
};

export const submitSolution = async (payload: CreateSubmissionDto) => {
  const res = await fetch(`${API_URL}/submissions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to submit solution');
  }

  return res.json();
};
