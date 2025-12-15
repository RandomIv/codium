import { useQuery } from '@tanstack/react-query';
import { fetchProblems } from '@/lib/problems';

export const useProblems = () => {
  return useQuery({
    queryKey: ['problems'],
    queryFn: fetchProblems,
  });
};
