import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '../../services/index.js';
import { formattedMessages } from '../../utils/formattedMessages.js';

export const getContacts = (userID) => {
  return useQuery({
    queryKey: ['contacts', userID],
    queryFn: () => ChatService.getContacts(userID),
    enabled: !!userID && typeof userID === 'string',
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const getMessages = (senderID, receiverID) => {
  return useQuery({
    queryKey: ['messages', senderID, receiverID],
    queryFn: async () => {
      const data = await ChatService.getMessages(senderID, receiverID);
      return data;
    },
    enabled: !!senderID && !!receiverID && typeof senderID === 'string' && typeof receiverID === 'string',
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    select: (data) => {
      return formattedMessages(data, senderID);
    },
  });
};
