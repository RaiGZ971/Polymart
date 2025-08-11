import { ChatApp } from '../../components';

export default function ChatModal({ isOpen, onClose, sellerContact }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 shadow-glow flex items-start justify-end">
      <div className="h-screen w-[30%] bg-white rounded-l-xl shadow-lg relative">
        <ChatApp
          initialView="chat"
          initialChatData={sellerContact}
          onClose={onClose}
          fromOrderDetails={true}
        />
      </div>
    </div>
  );
}
