import { useState, useCallback } from 'react';
import { useChat } from './useChat';

export function useChatNavigation() {
    const { chats } = useChat();
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [currentView, setCurrentView] = useState('preview'); // 'preview' or 'chat'

    const selectedChat = selectedChatId ? chats.find(chat => chat.id === selectedChatId) : null;

    const openChat = useCallback((chatId) => {
        setSelectedChatId(chatId);
        setCurrentView('chat');
    }, []);

    const closeChat = useCallback(() => {
        setSelectedChatId(null);
        setCurrentView('preview');
    }, []);

    const openChatById = useCallback((id) => {
        const chat = chats.find(chat => chat.id === id);
        if (chat) {
            openChat(id);
        }
    }, [chats, openChat]);

    return {
        currentView,
        selectedChat,
        selectedChatId,
        openChat,
        closeChat,
        openChatById
    };
}