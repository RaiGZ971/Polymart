import { useState, useMemo, useRef, useEffect } from 'react';
import { WebSocketService } from '../services/websocketService';
import {
  getContacts,
  getMessages,
  updateReadStatus,
} from './queries/useChatQueries';
import { getUsersDetails } from '../queries/getUsersDetails.js';
import { getProductsDetails } from '../queries/getProductsDetails.js';
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
  const {
    mutate: updateStatus,
    isLoading: updateStatusLoading,
    error: updateStatusError,
  } = updateReadStatus();

  const { userID } = useAuthStore();
  const [currentChatID, setCurrentChatID] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contactIDs, setContactIDs] = useState([]);
  const [latestMessages, setlatestMessages] = useState([]);
  const [productIDs, setProductIDs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [currentRoomID, setCurrentRoomID] = useState('');
  const [readStatus, setReadStatus] = useState(0);

  const contactsProfileQueries = getUsersDetails(contactIDs);
  const productsProfileQueries = getProductsDetails(productIDs);

  const {
    data: rawContacts = {},
    isLoading: contactsLoading,
    error: contactsError,
  } = getContacts(userID);

  useEffect(() => {
    if (rawContacts?.contacts) {
      setContactIDs(rawContacts.contacts);
      setlatestMessages(rawContacts.latest_messages);
      setProductIDs(rawContacts.products);
    }
  }, [rawContacts]);

  const contactsProfile = useMemo(() => {
    const profiles = contactsProfileQueries.every(
      (userResult) => !userResult.isLoading && !userResult.isError
    );

    if (!profiles) {
      return [];
    }

    return contactsProfileQueries.map((userResult) => userResult.data);
  }, [contactsProfileQueries]);

  const productsProfile = useMemo(() => {
    const products = productsProfileQueries.every(
      (product) => !product.isLoading && !product.isError
    );

    if (!products) {
      return [];
    }

    return productsProfileQueries.map((product) => product.data);
  }, [productsProfileQueries]);

  useEffect(() => {
    if (
      contactsProfile.length &&
      contactsProfile[0]?.user_id &&
      productsProfile[0]?.listing_id
    ) {
      const newContacts = formattedContacts(
        contactsProfile,
        productsProfile,
        latestMessages
      );

      setContacts((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newContacts)) {
          return newContacts;
        }
        return prev;
      });
    }
  }, [contactsProfile, productsProfile, latestMessages]);

  const {
    data: fetchedMessages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = getMessages(userID, currentChatID);

  useEffect(() => {
    if (fetchedMessages.length !== 0) {
      setMessages(fetchedMessages);

      updateStatus(currentChatID, {
        onSuccess: (data) => {
          console.log('Successful Read Status Update: ', data);
        },
      });
    }
  }, [fetchedMessages]);

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
        productID: message[0]?.product_id,
        content: message[0]?.content || null,
        image: message[0]?.image || null,
      };

      console.log('📤 WebSocket message format:', wsMessage);
      wsService.current.sendMessage(wsMessage);
      console.log('MESSAGE SENT');
    }
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

        updateStatus(currentChatID, {
          onSuccess: (data) => {
            console.log('Successful Read Status Update: ', data);
          },
        });
        // Handle incoming message - add to messages state
        if (data && (data.content || data.image)) {
          let incomingMessage = {
            id: data.message_id || Date.now(),
            sender: data.sender_id === userID ? 'user' : 'other',
            timestamp: data.timestamp || new Date().toISOString(),
          };

          data.content
            ? (incomingMessage.text = data.content)
            : (incomingMessage.imagePreview = data.image);

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

  useEffect(() => {
    setReadStatus(
      contacts.filter((chat) => chat.senderID !== userID && !chat.readStatus)
        .length
    );
  }, [contacts]);

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

  return {
    // Chat list functionality
    readStatus,
    chats: contacts,

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
