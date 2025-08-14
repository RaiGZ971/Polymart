import { formattedNotifications } from '@/utils/formattedNotifications.js';
import { NotificationService } from '../../../services/notificationService.js';
import { useQuery } from '@tanstack/react-query';

export const getUserNotification = (userID) => {
  return useQuery({
    queryKey: ['notification', userID],
    queryFn: () => NotificationService.getUserNotification(userID),
    enabled: !!userID && typeof userID === 'string',
    staleTime: 60 * 1000, // 1 minute - don't refetch for 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    select: (data) => {
      return formattedNotifications(data);
    },
  });
};
