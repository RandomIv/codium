import { useQuery } from '@tanstack/react-query';
import { fetchProblemById } from '@/lib/problems';

export const useProblem = (id: string) => {
  return useQuery({
    queryKey: ['problem', id],
    queryFn: () => fetchProblemById(id),
    enabled: !!id,
  });
};
