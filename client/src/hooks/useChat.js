import { useState, useMemo, useRef, useEffect } from 'react';
import { WebSocketService } from '../services/websocketService';
import { getContacts, getMessages } from './queries/useChatQueries';
import { getUsersDetails } from '../queries/getUsersDetails.js';
import { formattedContacts } from '../utils/index.js';
import { useAuthStore } from '../store/authStore.js';
import { formattedMessages } from '../utils/index.js';
import { useQueryClient } from '@tanstack/react-query';

export function useChat() {
  const wsService = useRef(new WebSocketService());
  const queryClient = useQueryClient();

  const { userID, data: userData } = useAuthStore();
  const [currentChatID, setCurrentChatID] = useState(null);
  const [messages, setMessages] = useState([]);
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

  useEffect(() => {
    if (usersData.length && usersData[0]?.user_id) {
      const newContacts = formattedContacts(usersData, latestMessages);

      setContacts((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newContacts)) {
          return newContacts;
        }
        return prev;
      });
    }
  }, [usersData, latestMessages]);

  const {
    data: fetchedMessages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = getMessages(userID, currentChatID);

  useEffect(() => {
    if (fetchedMessages.length !== 0) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  const unread = useMemo(() => {
    return contacts.filter((chat) => chat.isUnread).length;
  }, [contacts]);

  // Message operations

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

  const addMessage = (message, receiverID) => {
    const response = formattedMessages(message, userID);
    setMessages((prev) => [...prev, ...response]);

    contacts.forEach((contact) => {
      if (contact.id === receiverID) {
        contact.message = response.text || 'Sent An Image';
      }
    });

    queryClient.invalidateQueries({
      queryKey: ['messages', userID, receiverID],
    });

    queryClient.invalidateQueries({
      queryKey: ['contacts', userID],
    });
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
