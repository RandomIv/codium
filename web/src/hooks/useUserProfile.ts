import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '@/lib/auth';

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
    retry: 1,
  });
};
