import { useMutation, useQuery } from '@tanstack/react-query';
import { ChatService } from '../../../services/index.js';
import { useAuthStore } from '../../../store/authStore.js';
import { getRoomID } from '../../../utils/index.js';
import { OrderService } from '../../../services/index.js';

export const postMessage = () => {
  return useMutation({
    mutationFn: ({ sellerID, form }) => {
      const userID = useAuthStore.getState().userID;
      const roomID = getRoomID(userID, sellerID);
      return ChatService.uploadMessage(roomID, form);
    },
  });
};

export const postMessageImage = () => {
  return useMutation({
    mutationFn: ({ sellerID, file }) => {
      const userID = useAuthStore.getState().userID;
      const roomID = getRoomID(userID, sellerID);
      return ChatService.uploadImageBucket(roomID, file);
    },
  });
};

export const getOrder = (orderID) => {
  return useQuery({
    queryKey: ['order'],
    queryFn: () => OrderService.getUserOrders(),
    enabled: !!orderID,
    select: (data) => {
      const foundOrder = data.orders.find(
        (order) => order.listing_id === orderID
      );
      if (foundOrder) {
        return foundOrder;
      }
    },
  });
};
