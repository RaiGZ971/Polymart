import { useState, useEffect } from "react";
import ChatPreview from "./ChatPreview";
import ChatContainer from "./ChatContainer";

export default function ChatApp({ initialChatId = null, onClose }) {
  const [currentView, setCurrentView] = useState("preview");
  const [selectedChat, setSelectedChat] = useState(null);

  // If initialChatId is provided, start with that chat open
  useEffect(() => {
    if (initialChatId) {
      // You'll need to get the chat data by ID from your useChat hook
      // For now, we'll just set the view to preview and let user select
      setCurrentView("preview");
    }
  }, [initialChatId]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat); // Store the entire chat object
    setCurrentView("chat"); // Switch to chat view
  };

  const handleBack = () => {
    if (currentView === "chat") {
      // If in chat view, go back to preview
      setCurrentView("preview");
      setSelectedChat(null);
    } else {
      // If in preview view, close the entire chat overlay
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <div className="h-full">
      {currentView === "preview" ? (
        <ChatPreview
          onChatSelect={handleChatSelect} // Pass chat object
          onBack={handleBack}
        />
      ) : (
        <ChatContainer
          userID={initialChatId}
          chatData={selectedChat} // Pass the selected chat data
          onBack={handleBack}
        />
      )}
    </div>
  );
}
