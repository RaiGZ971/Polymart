import { useState, useEffect } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { Flag, ChevronLeft, Send } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useProductInfo } from '../../hooks/useProductInfo';
import { formattedMessage } from '../../utils/index.js';
import {
  postMessage,
  postMessageImage,
} from './queries/useChatContainerQueries.js';

const ChatContainer = ({ chatData, onBack }) => {
  const username = chatData?.username || 'nintendocicc';
  const avatarUrl = chatData?.avatarUrl || '/path/to/avatar.jpg';
  const productImageUrl =
    chatData?.productImage || '/path/to/product-image.jpg';
  const chatID = chatData?.id;

  const { messages, addMessage, selectChat } = useChat();
  const productInfo = useProductInfo(chatID);
  const { productName, productPrice, meetUpPlace, meetUpDay, meetUpTime } =
    productInfo;
  const productImage = productImageUrl;
  const sendMessage = postMessage();
  const sendImage = postMessageImage();

  // Select this chat when component mounts
  useEffect(() => {
    if (chatID) {
      selectChat(chatID);
    }
  }, [chatID, selectChat]);

  const handleSend = async (messageData) => {
    let form;

    if (messageData.type === 'image') {
      const imageURL = await sendImage.mutateAsync({
        sellerID: chatID,
        file: messageData.image,
      });

      console.log('S3 Bucket Image Upload: ', imageURL);

      messageData.image = imageURL.image;
    }

    form = formattedMessage(messageData, chatID);

    sendMessage.mutate(
      { sellerID: chatID, form },
      {
        onSuccess: (data) => {
          const arrayMessage = [data];
          addMessage(arrayMessage, chatID);
          console.log('Uploaded Message in dynamodb: ', data);
        },
      }
    );
  };

  return (
    <div className="w-full max-w-md h-screen border rounded-tl-2xl rounded-bl-2xl shadow-md flex flex-col overflow-hidden font-montserrat">
      <div className="bg-white shadow-md pt-10 py-6 font-bold">
        <div className="flex items-center justify-between px-10">
          <ChevronLeft
            size={24}
            className="cursor-pointer hover:text-primary-red transition-colors"
            onClick={onBack}
          />
          <span>{username}</span>
          <Flag size={24} />
        </div>
      </div>
      <div className="bg-[#FFE38770] text-left px-10 pt-2 pb-3 space-y-2 flex flex-row justify-between shadow-md">
        <div>
          <div className="flex items-center space-x-3 py-2">
            <div className="space-y-0">
              <h1 className="text-base font-semibold leading-tight">
                {productName}
              </h1>
              <p className="text-lg font-bold text-primary-red leading-tight">
                {productPrice}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs">
              {meetUpPlace} | {meetUpDay} | {meetUpTime}{' '}
            </p>
          </div>
        </div>
        <div>
          <img
            src={productImage}
            alt={productName}
            className="w-16 h-16 rounded-lg object-cover"
          />
        </div>
      </div>
      <div className="flex-1 bg-white overflow-y-auto">
        <MessageList messages={messages} avatarUrl={avatarUrl} />
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default ChatContainer;
