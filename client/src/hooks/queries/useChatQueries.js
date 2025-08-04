import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '../../services/index.js';
import { formattedMessages } from '../../utils/formattedMessages.js';

export const getContacts = (userID) => {
  return useQuery({
    queryKey: ['contacts', userID],
    queryFn: () => ChatService.getContacts(userID),
    enabled: !!userID,
  });
};

export const getMessages = (senderID, receiverID) => {
  return useQuery({
    queryKey: ['messages', senderID, receiverID],
    queryFn: async () => {
      const data = await ChatService.getMessages(senderID, receiverID);
      return data;
    },
    enabled: !!senderID && !!receiverID,
    select: (data) => {
      return formattedMessages(data, senderID);
    },
  });
};
