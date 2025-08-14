import { AuthService } from '@/services';
import { useMutation, useQuery } from '@tanstack/react-query';

export const postLogin = () => {
  return useMutation({
    mutationFn: (loginData) => AuthService.login(loginData),
  });
};
