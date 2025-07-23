import MessageBubble from "./MessageBubble";

const MessageList = ({ messages, avatarUrl }) => {
  const getMessageProps = (index) => {
    const currentMessage = messages[index];
    const prevMessage = messages[index - 1];
    const nextMessage = messages[index + 1];

    const isConsecutive =
      (prevMessage && prevMessage.sender === currentMessage.sender) ||
      (nextMessage && nextMessage.sender === currentMessage.sender);

    const isFirst =
      !prevMessage || prevMessage.sender !== currentMessage.sender;
    const isLast = !nextMessage || nextMessage.sender !== currentMessage.sender;

    return { isFirst, isLast, isConsecutive };
  };

  return (
    <div className="p-4 space-y-1">
      {messages.map((msg, index) => (
        <MessageBubble
          key={index}
          message={msg}
          sender={msg.sender}
          avatarUrl={avatarUrl}
          {...getMessageProps(index)}
        />
      ))}
    </div>
  );
};

export default MessageList;
