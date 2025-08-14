export const formattedMessages = (messages, senderID) => {
  let responses = [];
  messages.map((message) => {
    let sender = 'other';

    if (message.sender_id === senderID) {
      sender = 'user';
    }

    if (message.content) {
      responses.push({
        text: message.content,
        sender: sender,
      });
    }

    if (message.image) {
      responses.push({
        imagePreview: message.image,
        sender: sender,
      });
    }
  });

  return responses;
};
