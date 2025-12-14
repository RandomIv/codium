import { useMutation } from '@tanstack/react-query';
import { loginUser, registerUser } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { TokenPayload } from '@/types/token-payload';
import { Role } from '@/types/enums';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const token = data.token || data.access_token || data.accessToken;
      if (!token) return;

      try {
        const decoded = jwtDecode<TokenPayload>(token);

        const user = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role as Role,
        };

        setAuth(user, token);
        router.push('/problems');
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    },
  });
};
export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      router.push('/login');
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
};
