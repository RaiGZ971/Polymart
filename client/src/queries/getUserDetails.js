import { UserService } from '../services/index.js';
import { useQueries, useQuery } from '@tanstack/react-query';

export const getUserDetails = (userID) => {
  return useQuery({
    queryKey: ['user-details', userID],
    queryFn: () => UserService.getUserProfile(userID),
    enabled: !!userID,
    staleTime: 10 * 60 * 1000,
    select: (data) => {
      return data.data;
    },
  });
};
