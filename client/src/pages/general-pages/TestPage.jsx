import { ChatContainer, ChatPreview, ChatApp } from "../../components";

export default function TestPage() {
    // You can now open a specific chat by passing the ID
    const chatIdToOpen = 2; // Example: open chat with ID 2

    return(
        <>
        {/* <ChatContainer/> */}
        {/* <ChatPreview /> */}
        
        {/* Open chat list */}
        {/* <ChatApp /> */}
        
        {/* Open specific chat by ID */}
        <ChatApp initialChatId={chatIdToOpen} />
        </>
    );
}