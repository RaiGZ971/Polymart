import { useState } from 'react';

export function useFileUpload(formData, setFormData) {
  // Generic file change handler
  const handleFileChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.files[0]
    }));
  };

  // Remove file handler
  const removeFile = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: null
    }));
  };

  // Trigger file input click
  const triggerFileInput = (inputId) => {
    document.getElementById(inputId).click();
  };

  // Validate file type and size
  const validateFile = (file, allowedTypes = ['image/*'], maxSize = 3 * 1024 * 1024) => {
    if (!file) return { isValid: false, error: 'No file selected' };
    
    const isValidType = allowedTypes.some(type => {
      if (type === 'image/*') {
        return file.type.startsWith('image/');
      }
      return file.type === type;
    });

    if (!isValidType) {
      return { isValid: false, error: 'Invalid file type' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size too large' };
    }

    return { isValid: true, error: null };
  };

  // Get file preview URL
  const getFilePreviewURL = (file) => {
    return file ? URL.createObjectURL(file) : null;
  };

  return {
    handleFileChange,
    removeFile,
    triggerFileInput,
    validateFile,
    getFilePreviewURL
  };
}