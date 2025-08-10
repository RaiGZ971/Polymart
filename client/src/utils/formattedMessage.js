import { useAuthStore } from '../store/authStore.js';

export const formattedMessage = (form, sellerID) => {
  let response = {
    sender_id: useAuthStore.getState().userID,
    receiver_id: sellerID,
  };

  if (form.type === 'text') {
    response.content = form.text;
  }
  if (form.type === 'image') {
    response.image = form.image;
  }

  return response;
};
