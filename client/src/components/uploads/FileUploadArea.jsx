import React from "react";
import { Add, FilePreview } from "../index";

export function FileUploadArea({
  file,
  onFileChange,
  onRemove,
  inputId,
  acceptTypes = "image/*,.pdf",
  title,
  subtitle,
  buttonText = "Click to upload file",
  maxSize = "3MB",
  allowedFormats = "jpg, jpeg, png",
}) {
  return (
    <div className="w-full min-h-[350px] flex-1 flex flex-col gap-4 text-left p-4">
      <div className="space-y-1">
        <div className="text-xl text-gray-800 font-semibold">{title}</div>
        <span className="italic text-gray-400 text-base">{subtitle}</span>
      </div>

      {!file ? (
        // Show upload area when no file is selected
        <>
          <Add
            onClick={() => document.getElementById(inputId).click()}
            text={buttonText}
          />

          <div className="flex flex-row justify-between text-sm text-gray-500 italic mt-4">
            <p className="mb-2">Files should be in {allowedFormats} format.</p>
            <p>Maximum file size per image: {maxSize}</p>
          </div>
        </>
      ) : (
        // Show file preview when file is selected
        <div className="flex-1 flex flex-col justify-center">
          <FilePreview file={file} onRemove={onRemove} />
        </div>
      )}

      <input
        id={inputId}
        type="file"
        accept={acceptTypes}
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}
