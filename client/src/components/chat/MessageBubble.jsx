const MessageBubble = ({ message, sender = "user", isFirst, isLast, isConsecutive, avatarUrl }) => {
  const isUser = sender === "user";
  
  const getBorderRadius = () => {
    if (!isConsecutive) {
      return "rounded-2xl";
    }
    
    if (isUser) {
      if (isFirst && isLast) return "rounded-2xl";
      if (isFirst) return "rounded-2xl rounded-br-sm";
      if (isLast) return "rounded-2xl rounded-tr-none";
      return "rounded-2xl rounded-tr-sm rounded-br-sm";
    } else {
      if (isFirst && isLast) return "rounded-2xl";
      if (isFirst) return "rounded-2xl rounded-bl-sm";
      if (isLast) return "rounded-2xl rounded-tl-none";
      return "rounded-2xl rounded-tl-sm rounded-bl-sm";
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      {!isUser && (isLast || (!isConsecutive)) && (
        <div className="flex-shrink-0 mr-2">
          <img
            src={avatarUrl || "/default-avatar.png"}
            alt="User avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      )}
      
      {!isUser && !(isLast || (!isConsecutive)) && (
        <div className="w-8 mr-2"></div>
      )}
      
      <div
        className={`px-4 py-2 max-w-xs text-sm text-left break-words ${getBorderRadius()} ${
          isUser
            ? "bg-hover-red text-white"
            : "bg-gray-200 text-gray-900"
        }`}
      >
        {message.imagePreview && (
          <img
            src={message.imagePreview}
            alt="Shared image"
            className="w-full rounded-lg mb-0 max-w-xs"
          />
        )}
        {message.text && <div className="whitespace-pre-wrap">{message.text}</div>}
        {/* Fallback for simple text messages */}
        {typeof message === 'string' && <div className="whitespace-pre-wrap">{message}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;
