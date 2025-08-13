import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '../../services/index.js';
import { formattedMessages } from '../../utils/formattedMessages.js';
import { useAuthStore } from '../../store/authStore.js';

export const getContacts = (userID) => {
  return useQuery({
    queryKey: ['contacts', userID],
    queryFn: () => ChatService.getContacts(userID),
    refetchOnMount: 'always',
    staleTime: 0,
    enabled: !!userID && typeof userID === 'string',
  });
};

export const getMessages = (senderID, receiverID) => {
  return useQuery({
    queryKey: ['messages', senderID, receiverID],
    queryFn: () => ChatService.getMessages(senderID, receiverID),
    enabled: !!senderID && !!receiverID,
    refetchOnMount: 'always',
    staleTime: 0,
    select: (data) => {
      return formattedMessages(data, senderID);
    },
  });
};

export const updateReadStatus = () => {
  return useMutation({
    mutationFn: (receiverID) =>
      ChatService.updateReadStatus(useAuthStore.getState().userID, receiverID),
  });
};
