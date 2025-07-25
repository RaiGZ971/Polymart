import { useState, useEffect } from "react";
import ChatPreview from "./ChatPreview";
import ChatContainer from "./ChatContainer";

export default function ChatApp({
  initialChatId = null,
  initialView = "preview",
  initialChatData = null,
  onClose,
  fromOrderDetails = false, // <-- add default value
}) {
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedChat, setSelectedChat] = useState(initialChatData);

  // If initialChatId is provided, start with that chat open
  useEffect(() => {
    if (initialChatId && initialView === "chat" && initialChatData) {
      setCurrentView("chat");
      setSelectedChat(initialChatData);
    }
  }, [initialChatId, initialView, initialChatData]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat); // Store the entire chat object
    setCurrentView("chat"); // Switch to chat view
  };

  const handleBack = () => {
    if (currentView === "chat") {
      if (fromOrderDetails) {
        // Close the chat modal and go back to order details
        if (onClose) onClose();
      } else {
        // Go back to chat preview
        setCurrentView("preview");
        setSelectedChat(null);
      }
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
          chatData={selectedChat} // Pass the selected chat data
          onBack={handleBack}
        />
      )}
    </div>
  );
}
