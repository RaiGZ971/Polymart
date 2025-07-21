import React from 'react';

export function ProfilePictureUpload({ 
  profilePicture, 
  onFileChange, 
  onRemove 
}) {
  return (
    <div className="w-1/2 flex flex-col gap-4 -ml-11">
      <div className="p-8 text-center flex flex-col items-center justify-center hover:border-gray-400 transition-colors duration-200">
        {profilePicture ? (
          <div className="flex flex-col items-center">
            <img 
              src={URL.createObjectURL(profilePicture)} 
              alt="Profile Preview" 
              className="w-52 h-52 rounded-full object-cover mb-4"
            />
            <p className="text-sm text-gray-600 mb-2">{profilePicture.name}</p>
            <button
              onClick={onRemove}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center">
            <div className="w-52 h-52 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-gray-800 font-medium mb-1">Upload Profile Picture</span>
            <span className="text-gray-400 text-sm">Click to browse files</span>
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}