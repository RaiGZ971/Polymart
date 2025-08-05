import { UserService } from '../services/index.js';
import { useQueries } from '@tanstack/react-query';

export const getUsersDetails = (userIDs) => {
  return useQueries({
    queries: userIDs.map((userID) => ({
      queryKey: ['user-details', userID],
      queryFn: () => UserService.getUserProfile(userID),
      enabled: !!userIDs,
      staleTime: 10 * 60 * 1000,
      select: (data) => {
        return data.data;
      },
    })),
  });
};
