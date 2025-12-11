import { useMutation } from '@tanstack/react-query';
import { submitSolution } from '@/lib/problems';

export const useSubmission = () => {
  return useMutation({
    mutationFn: submitSolution,
  });
};
