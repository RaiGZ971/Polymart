import { useState } from "react";

export default function ImageUploader({
  images = [],
  onImageUpload,
  onRemoveImage,
  maxImages = 5,
  error,
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files);
    }
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="w-full">
      <p className="text-gray-800 font-bold text-base mb-4">
        Upload Images ({images.length}/{maxImages}){" "}
        <span className="text-red-500">*</span>
      </p>

      <div className="grid grid-cols-5 gap-4">
        {/* Display uploaded images */}
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square">
            <img
              src={URL.createObjectURL(image)}
              alt={`Product ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
            />
            <button
              onClick={() => onRemoveImage(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add new image button */}
        {canAddMore && (
          <div
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
              ${
                dragActive
                  ? "border-primary-red bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("imageInput").click()}
          >
            <div className="text-center">
              <div className="text-2xl text-gray-400 mb-2">+</div>
              <p className="text-xs text-gray-500">Add Image</p>
            </div>
          </div>
        )}

        {/* Fill remaining slots with empty placeholders */}
        {Array.from(
          { length: maxImages - images.length - (canAddMore ? 1 : 0) },
          (_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-square border-2 border-gray-200 rounded-lg bg-gray-50"
            ></div>
          ),
        )}
      </div>

      <input
        id="imageInput"
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {!canAddMore && (
        <p className="text-sm text-gray-500 mt-2">
          Maximum {maxImages} images reached
        </p>
      )}
    </div>
  );
}
