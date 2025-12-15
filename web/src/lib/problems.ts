import {
  CreateProblemDto,
  UpdateProblemDto,
  CreateSubmissionDto,
} from '@/types/dto';
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

export const fetchProblemByIdSystem = async (id: string) => {
  const res = await fetch(`${API_URL}/problems/admin/${id}`, {
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
export const createProblem = async (payload: CreateProblemDto) => {
  const res = await fetch(`${API_URL}/problems`, {
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
    throw new Error(errorData.message || 'Failed to create problem');
  }

  return res.json();
};

export const updateProblem = async (id: string, payload: UpdateProblemDto) => {
  const res = await fetch(`${API_URL}/problems/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to update problem');
  }

  return res.json();
};

export const deleteProblem = async (id: string) => {
  const res = await fetch(`${API_URL}/problems/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to delete problem');
  }

  return res.json();
};
