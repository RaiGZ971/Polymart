import { useState } from "react";
import { ImagePlus, X, Send } from "lucide-react";

const ChatInput = ({ onSend }) => {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleSend = () => {
    if (text.trim() || selectedImage) {
      const messageData = {
        text: text.trim(),
        image: selectedImage,
        type: selectedImage ? "image" : "text",
      };
      onSend(messageData);
      setText("");
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  return (
    <div className="border-t bg-white items-center flex flex-col">
      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 pt-2 pb-1">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Selected"
              className="w-16 h-16 rounded-lg object-cover border"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-600"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex px-4 py-2 items-center justify-between w-full max-w-md gap-2">
        {/* Image upload button */}
        <label className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ImagePlus size={20} className="text-gray-500" />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <input
          className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none "
          type="text"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className=" text-primary-red px-4 py-1 border border-primary-red rounded-full text-sm hover:bg-hover-red hover:text-primary-red disabled:opacity-50"
          onClick={handleSend}
          disabled={!text.trim() && !selectedImage}
        >
          <Send className="inline pr-2 rotate-45 mt-1" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
