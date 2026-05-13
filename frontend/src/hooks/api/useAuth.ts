import type { Admin, LoginResponse } from '@dk/shared';
import type { LoginInput } from '@dk/shared/schemas';
import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export function useLoginMutation() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const data = await api.post<LoginResponse>('/auth/login', input);
      return data;
    },
    onSuccess: (data) => {
      login(data.token, data.admin);
    },
  });
}

export function useMeQuery() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<Admin>('/auth/me'),
    enabled: !!token,
  });
}
