import { formattedNotifications } from '@/utils/formattedNotifications.js';
import { NotificationService } from '../../../services/notificationService.js';
import { useQuery } from '@tanstack/react-query';

export const getUserNotification = (userID) => {
  return useQuery({
    queryKey: ['notification', userID],
    queryFn: () => NotificationService.getUserNotification(userID),
    enabled: !!userID,
    select: (data) => {
      return formattedNotifications(data);
    },
  });
};
