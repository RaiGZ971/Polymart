import { Trash } from "lucide-react";

export default function FilePreview({ file, onRemove, className = "" }) {
  if (!file) return null;

  const isImage = file.type?.startsWith('image/');
  const fileSize = (file.size / 1024 / 1024).toFixed(2);

  return (
    <div className={`mt-4 p-3 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-red rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{fileSize} MB</p>
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            <Trash className="w-4 h-4" />
          </button>
        )}
      </div>
      {isImage && (
        <img 
          src={URL.createObjectURL(file)} 
          alt="File Preview" 
          className="w-full h-auto max-h-[200px] rounded border object-cover"
        />
      )}
    </div>
  );
}