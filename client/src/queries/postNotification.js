import { useMutation } from '@tanstack/react-query';
import { NotificationService } from '../services/notificationService.js';

export const postNotification = () => {
  return useMutation({
    mutationFn: (form) => NotificationService.uploadNotification(form),
  });
};
