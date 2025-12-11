import { CreateSubmissionDto } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchProblemById = async (id: string) => {
  const res = await fetch(`${API_URL}/problems/${id}`);
  if (!res.ok) throw new Error('Failed to fetch problem');
  return res.json();
};

export const submitSolution = async (payload: CreateSubmissionDto) => {
  const res = await fetch(`${API_URL}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit solution');
  return res.json();
};
