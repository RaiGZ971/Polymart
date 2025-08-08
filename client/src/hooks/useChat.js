import { useState, useMemo, useRef, useEffect } from 'react';
import { WebSocketService } from '../services/websocketService';
import { getContacts, getMessages } from './queries/useChatQueries';
import { getUsersDetails } from '../queries/getUsersDetails.js';
import { formattedContacts } from '../utils/index.js';
import { useAuthStore } from '../store/authStore.js';

export function useChat() {
  const wsService = useRef(new WebSocketService());
  const { currentUser } = useAuthStore();
  const userID = currentUser?.user_id || currentUser?.id;
  const [currentChatID, setCurrentChatID] = useState(null);
  const [contacts, setContacts] = useState([]);

  const {
    data: rawContacts = [],
    isLoading: contactsLoading,
    error: contactsError,
  } = getContacts(userID);

  const contactIDs = rawContacts.contacts || [];
  const latestMessages = rawContacts.latest_messages || [];

  const userResults = getUsersDetails(contactIDs);
  const usersData = userResults.map((userResult) => userResult.data);

  console.log(rawContacts);

  useEffect(() => {
    if (contactIDs.length !== 0) {
      setContacts(formattedContacts(usersData, latestMessages));
    }
  }, [usersData, latestMessages]);

  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = getMessages(userID, currentChatID);

  const unread = contacts.filter((chat) => chat.isUnread).length;

  // Message operations
  const addMessage = (messageData) => {
    if (!currentChatID) return;

    if (typeof messageData === 'string') {
      setMessages((prev) => [...prev, { text: messageData, sender: 'user' }]);
    } else {
      const newMessage = {
        text: messageData.text || '',
        image: messageData.image,
        imagePreview: messageData.image
          ? URL.createObjectURL(messageData.image)
          : null,
        type: messageData.type,
        sender: 'user',
      };
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  const addBotResponse = () => {
    if (!currentChatID) return;

    const responses = [
      'Thanks for your message!',
      'Got it, will get back to you soon!',
      'Sounds good to me!',
      'Let me check on that.',
    ];
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    setMessages((prev) => [...prev, { text: randomResponse, sender: 'other' }]);
  };

  const markAsRead = (chatId) => {
    // Implementation for marking specific chat as read
  };

  const selectChat = (chatId) => {
    setCurrentChatID(chatId);
  };

  return {
    // Chat list functionality
    unread,
    chats: contacts,
    markAsRead,

    // Individual chat functionality
    currentChatID,
    messages,
    addMessage,
    addBotResponse,
    selectChat,

    // Loading states
    messagesLoading,
    contactsLoading,
  };
}
