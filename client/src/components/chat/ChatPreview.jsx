import { ChevronLeft } from 'lucide-react';
import { useChat } from '../../hooks/useChat';

export default function ChatPreview({ onChatSelect, onBack }) {
    const { unread, chats } = useChat();
    
    return (
        <>
        {/* Chat Preview Component */}
        <div className="w-full h-screen border rounded-tl-2xl rounded-bl-2xl shadow-md flex flex-col overflow-hidden font-montserrat">
            <div className="bg-white pt-10 py-6 relative">
                <div className="flex items-center justify-center px-10">
                    <div 
                        className='absolute left-6 text-gray-400 font-regular text-sm cursor-pointer hover:text-primary-red transition-colors'
                        onClick={onBack}
                    >
                        <ChevronLeft size={24} className='inline' /> 
                        Back
                    </div>
                    <span className='font-bold text-primary-red text-xl'>All Chats</span>
                </div>
            </div>
            <div className='text-center text-xs font-semibold italic text-gray-400'>
                You have {unread} unread messages
            </div>
            <div className='w-[90%] items-center justify-center mx-auto mt-4 space-y-2 overflow-y-auto flex-1 p-2'>
                {chats.map((chat) => (
                    <ChatPreviewComponent 
                        key={chat.id}
                        chatData={chat}
                        onSelect={() => onChatSelect(chat)}
                    />
                ))}
            </div>
        </div>
        </>
    );
}

function ChatPreviewComponent({ chatData, onSelect }){
    const { username, message, sent, productImage, avatarUrl, isUnread } = chatData;
    
    const truncateMessage = (text, maxLength = 30) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    
    return(
        <div 
            className={`text-left flex flex-row items-center gap-4 rounded-xl p-4 w-full hover:shadow-glow transition-shadow duration-300 justify-between cursor-pointer ${isUnread ? 'bg-red-50 border-l-4 border-primary-red' : ''}`}
            onClick={onSelect}
        >
            <div className="flex flex-row items-center gap-4">
                <div className="relative">
                    <img src={avatarUrl} alt="User Avatar" className="w-12 h-12 rounded-full object-cover" />
                    {isUnread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                </div>
                <div className="flex flex-col py-2 text-left items-start">
                    <h1 className={`text-base leading-tight ${isUnread ? 'font-bold' : 'font-semibold'}`}>{username}</h1>
                    <p className={`text-xs ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{truncateMessage(message)}</p>
                    <p className="text-[10px] text-gray-400 italic">{sent}</p>
                </div>
            </div>
            <img src={productImage} alt="Product Image" className="w-12 h-12 rounded-lg object-cover" />
        </div>
    );
}