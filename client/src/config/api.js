import { useAuthStore } from '../store/authStore.js';

const API_CONFIG = {
    development: {
        API_BASE: "http://localhost:8000",
        WS_BASE: "ws://localhost:8000"
    },
    production: {
        API_BASE: "https://producion-api.com",
        WS_BASE: "wss://production-websocket-api.com"
    }
};

const env = import.meta.env.MODE || "development";
export const { API_BASE, WS_BASE } = API_CONFIG[env];

//headers
export const getHeaders = (includeAuth = true) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    if(includeAuth){
        const token = useAuthStore.getState().token;
        if(token) {
            headers['Authorization'] = `Bearer ${token}`;
            // Only log in development
            if (import.meta.env.DEV) {
                console.log('🔑 Adding auth header with token:', token.substring(0, 20) + '...');
            }
        }
        // Removed unnecessary error log for missing token during logout
    }

    return headers
}