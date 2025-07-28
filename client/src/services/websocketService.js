import { WS_BASE } from '../config/api.js';

export class WebSocketService{
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    connect(roomID, senderID, receiverID, onMessage, onConnect, onDisconnect, onError){
        const wsUrl = `${WS_BASE}/dynamodb/message/${roomID}/${senderID}/${receiverID}`;

        try{
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                if(onConnect) onConnect();
            };

            this.ws.onmessage = (event) => {
                try{
                    const data = JSON.parse(event.data);
                    if(onMessage) onMessage(data);
                }catch (error){
                    console.error(`Failed to parse WebSocket message: `, error);
                    if(onError) onError(error);
                }
            }

            this.onclose = (event) => {
                console.log(`WebSocket disconnected`);
                if(onDisconnect) onDisconnect();

                if(this.reconnectAttempts < this.maxReconnectAttempts){
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        this.connect(roomID, senderID, receiverID, onMessage, onConnect, onDisconnect, onError);
                    }, this.reconnectDelay * this.reconnectAttempts);
                }
            };

            this.ws.onerror = (error) => {
                console.error(`WebSocket error: `, error);
                if(onError) onError(error);
            };

        }catch(error){
            console.error('Failed to create WebSocket connection: ', error);
            if(onError) onError(error);
        }
    }

    sendMessage(message){
        if(this.ws && this.ws.readyState === WebSocket.OPEN){
            this.ws.send(JSON.stringify(message));
        }else{
            console.error(`WebSocket is not conected`)
        }
    }

    disconnect(){
        if(ihis.ws){
            this.ws.close();
            this.ws = null
        }
    }

    isConnected(){
        return this.ws && this.ws.readyState === WebSocket.OPEN
    }
}