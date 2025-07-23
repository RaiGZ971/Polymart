import { useState, useEffect, useRef } from 'react';
import { WebSocketService } from '../services/websocketService';
import { ChatService } from '../services';
import { formattedMessages } from '../utils/formattedMessages';

export function useChat(userID) {
    //Chat list data
    const [chats] = useState([
        {
            id: "655b74fe4ea14086",
            username: "nintendocicc",
            sent: "2 hours ago",
            productImage: "https://picsum.photos/200/300",
            avatarUrl: "https://picsum.photos/150",
            isUnread: true
        },
        {
            id: 2,
            username: "FvlSky",
            sent: "4 hours ago",
            productImage: "https://picsum.photos/201/301",
            avatarUrl: "https://picsum.photos/151",
            isUnread: true
        },
        {
            id: 3,
            username: "Xxuinz",
            sent: "1 day ago",
            productImage: "https://picsum.photos/202/302",
            avatarUrl: "https://picsum.photos/152",
            isUnread: false,
        },
        {
            id: 4,
            username: "Nomzz",
            sent: "3 day ago",
            productImage: "https://picsum.photos/202/303",
            avatarUrl: "https://picsum.photos/153",
            isUnread: false,
        }
    ]);

    //All chat messages storage
    const [allChatMessages] = useState({
        1: [
            { text: "san na po kayo?", sender: "other" },
            { text: "dito po", sender: "user" },
            { text: "???", sender: "other" },
            { text: "hahahah", sender: "user" },
        ],
        2: [
            { text: "Is this still available?", sender: "other" },
            { text: "Yes, it's still available!", sender: "user" },
            { text: "Hindi po ako bogus buyer, magkano po yung ano sa ano?", sender: "other" }
        ],
        3: [
            { text: "Bakit po kayo nagcancel?", sender: "user" },
            { text: "Sorry po, nahablot po wallet ko hahaha", sender: "other" },
        ],
        4: [
            { text: "Thanks for the quick delivery!", sender: "other" },
            { text: "You're welcome! Hope you like it", sender: "user" },
            { text: "Thank u po hahaha", sender: "other" }
        ]
    });

    const [contactIDs, setContactIDs] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    //const [chats, setChats] = useState([]);
    const [error, setError] = useState([]);
    const [loading, setLoading] = useState([]);

    
    const wsService = useRef(new WebSocketService());

    const fetchContacts = async () => {
        setLoading(true);
        setError(null);
        try{
            const data = await ChatService.getContacts(userID);
            setContactIDs(data.contacts);
        }catch (error){
            setError(error.message);
            console.error('Failed to fetch contacts: ', error);
        }finally{
            setLoading(false);
        }
    }

    const fetchMessages = async (senderID, receiverID) => {
        try{
            const data = await ChatService.getMessages(senderID, receiverID);
            return await formattedMessages(data, senderID);
        }catch(error){
            setError(error.message);
            console.error('Failed to fetch messages: ', error);
        }
    };

    // Load messages when chat changes
    useEffect(() => {
        const loadMessages = async () => {
            if (currentChatId) {
                const chatMessages = await fetchMessages(userID, currentChatId) || [
                    { text: "Hello! How can I help you?", sender: "other" }
                ];
                setMessages(chatMessages);
                console.log(chatMessages)
            }
        };

        loadMessages();
    }, [currentChatId]);

    // Get latest message for each chat
    const getLatestMessage = (chatId) => {
        const messages = allChatMessages[chatId] || [];
        if (messages.length === 0) return "No messages yet";
        
        const lastMessage = messages[messages.length - 1];
        const prefix = lastMessage.sender === "user" ? "You: " : "";
        return prefix + lastMessage.text;
    };

    // Add latest message to each chat
    const chatsWithMessages = chats.map(chat => ({
        ...chat,
        message: getLatestMessage(chat.id)
    }));

    const unread = chatsWithMessages.filter(chat => chat.isUnread).length;

    // Message operations
    const addMessage = (messageData) => {
        if (!currentChatId) return;

        if (typeof messageData === 'string') {
            setMessages((prev) => [...prev, { text: messageData, sender: "user" }]);
        } else {
            const newMessage = {
                text: messageData.text || "",
                image: messageData.image,
                imagePreview: messageData.image ? URL.createObjectURL(messageData.image) : null,
                type: messageData.type,
                sender: "user"
            };
            setMessages((prev) => [...prev, newMessage]);
        }
    };

    const addBotResponse = () => {
        if (!currentChatId) return;

        const responses = [
            "Thanks for your message!",
            "Got it, will get back to you soon!",
            "Sounds good to me!",
            "Let me check on that."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setMessages((prev) => [...prev, { text: randomResponse, sender: "other" }]);
    };

    const markAsRead = (chatId) => {
        // Implementation for marking specific chat as read
    };

    const selectChat = (chatId) => {
        setCurrentChatId(chatId);
    };

    return {
        // Chat list functionality
        unread,
        chats: chatsWithMessages,
        markAsRead,
        
        // Individual chat functionality
        currentChatId,
        messages,
        addMessage,
        addBotResponse,
        selectChat,
    };
}