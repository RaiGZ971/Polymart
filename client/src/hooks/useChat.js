import { useState, useMemo, useRef, useEffect } from 'react';
import { WebSocketService } from '../services/websocketService';
import { getContacts, getMessages } from './queries/useChatQueries';
import { getUsersDetails } from '../queries/getUsersDetails.js';
import {
  formattedContacts,
  formattedMessages,
  getRoomID,
} from '../utils/index.js';
import { useAuthStore } from '../store/authStore.js';
import { useQueryClient } from '@tanstack/react-query';

export function useChat() {
  const wsService = useRef(new WebSocketService());
  const connectedRoomID = useRef(null);

  const queryClient = useQueryClient();

  const { userID, data: userData } = useAuthStore();
  const [currentChatID, setCurrentChatID] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [currentRoomID, setCurrentRoomID] = useState('');

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
        contact.message = response[0]?.text || 'Sent An Image';
      }
    });

    queryClient.invalidateQueries({
      queryKey: ['messages', userID, receiverID],
    });

    queryClient.invalidateQueries({
      queryKey: ['contacts', userID],
    });

    if (wsService.current.isConnected()) {
      console.log('MESSAGE SENDING...');

      // Format message for WebSocket - server expects simple object
      const wsMessage = {
        sender_id: userID,
        content: message[0]?.content || null,
        image: message[0]?.image || null,
      };

      console.log('📤 WebSocket message format:', wsMessage);
      wsService.current.sendMessage(wsMessage);
      console.log('MESSAGE SENT');
    }
  };

  const markAsRead = (chatId) => {
    // Implementation for marking specific chat as read
  };

  const selectChat = (chatId) => {
    // Disconnect from previous chat if switching
    if (currentChatID && currentChatID !== chatId && connectedRoomID.current) {
      console.log(
        '🔌 Disconnecting from previous room:',
        connectedRoomID.current
      );
      wsService.current.disconnect();
      connectedRoomID.current = null;
    }

    setCurrentChatID(chatId);
    setCurrentRoomID(getRoomID(userID, chatId));
  };

  useEffect(() => {
    if (!currentRoomID || !userID || !currentChatID) return;

    // If already connected to this room, don't reconnect
    if (connectedRoomID.current === currentRoomID) {
      console.log('✅ Already connected to room:', currentRoomID);
      return;
    }

    console.log('🔄 Connecting to room:', currentRoomID);

    wsService.current.connect(
      currentRoomID,
      userID,
      currentChatID,
      (data) => {
        console.log('📨 RECEIVED MESSAGE:', data);
        // Handle incoming message - add to messages state
        if (data && data.content) {
          const incomingMessage = {
            id: data.message_id || Date.now(),
            text: data.content,
            sender: data.sender_id === userID ? 'user' : 'other',
            timestamp: data.timestamp || new Date().toISOString(),
          };
          setMessages((prev) => [...prev, incomingMessage]);
        }
      },
      () => {
        console.log('connected to: ', currentRoomID);
        connectedRoomID.current = currentRoomID;
      },
      () => {
        console.log('disconnected from: ', currentRoomID);
        connectedRoomID.current = null;
      },
      (error) => console.error('WebSocket error:', error)
    );

    // No cleanup - let the connection persist
    return () => {
      // Only disconnect when switching chats or unmounting
    };
  }, [currentRoomID, userID, currentChatID]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (connectedRoomID.current) {
        console.log('🧹 Cleaning up WebSocket connection');
        wsService.current.disconnect();
        connectedRoomID.current = null;
      }
    };
  }, []);

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
