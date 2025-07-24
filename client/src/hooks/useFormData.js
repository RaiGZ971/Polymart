import { useState } from 'react';
import { initialFormData, fieldConfig } from '../data';

export const useFormData = () => {
  const [formData, setFormData] = useState(initialFormData);

  // Basic field change handler
  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  // Enhanced dropdown change handler with field reset logic
  const handleDropdownChange = (field) => (e) => {
    const config = fieldConfig[field] || {};
    const resetFields = config.resetFields || [];
    
    // Create reset object for dependent fields
    const resetObject = {};
    resetFields.forEach(resetField => {
      resetObject[resetField] = "";
    });
    
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
      ...resetObject // Reset dependent fields
    }));
  };

  // Update a specific field programmatically
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update multiple fields at once
  const updateFields = (fieldsObj) => {
    setFormData(prev => ({
      ...prev,
      ...fieldsObj
    }));
  };

  // Reset form data to initial state
  const resetFormData = () => {
    setFormData(initialFormData);
  };

  // Reset specific fields
  const resetFields = (fields) => {
    const resetObject = {};
    fields.forEach(field => {
      resetObject[field] = initialFormData[field] || "";
    });
    
    setFormData(prev => ({
      ...prev,
      ...resetObject
    }));
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleDropdownChange,
    updateField,
    updateFields,
    resetFormData,
    resetFields
  };
};