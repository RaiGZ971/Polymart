import { Textfield, Dropdown, DateDropdown, Textarea } from "../components";

export const useFieldRenderer = (formData, fieldConfig, handlers) => {
  const { handleChange, handleDropdownChange, handleFileChange } = handlers;

  // Helper function to get field value with auto-formatting
  const getFieldValue = (fieldName) => {
    const config = fieldConfig[fieldName] || {};
    const value = formData[fieldName] || "";
    
    // Apply uppercase if configured
    if (config.uppercase && typeof value === 'string') {
      return value.toUpperCase();
    }
    
    return value;
  };

  // Helper function to get field props
  const getFieldProps = (fieldName) => {
    const config = fieldConfig[fieldName] || {};
    return {
      required: config.required,
      integerOnly: config.integerOnly,
      studID: config.studID,
      type: config.type === 'password' ? 'password' : undefined
    };
  };

  // Enhanced helper function to get dropdown options
  const getFieldOptions = (fieldName) => {
    const config = fieldConfig[fieldName] || {};
    
    // Static options
    if (config.options) {
      return config.options;
    }
    
    // Dynamic options (like courses based on college)
    if (config.dynamicOptions) {
      return config.dynamicOptions(formData);
    }
    
    return [];
  };

  // Main render function using configuration
  const renderField = (fieldName) => {
    const config = fieldConfig[fieldName];
    if (!config) return null;

    const commonProps = {
      label: config.label,
      value: config.component === 'textfield' ? getFieldValue(fieldName) : formData[fieldName],
      required: config.required,
      disabled: config.disabled
    };

    switch (config.component) {
      case 'textfield':
        return (
          <Textfield
            key={fieldName}
            {...commonProps}
            onChange={handleChange(fieldName)}
            {...getFieldProps(fieldName)}
          />
        );
      
      case 'dropdown':
        return (
          <Dropdown
            key={fieldName}
            {...commonProps}
            onChange={handleDropdownChange(fieldName)}
            options={getFieldOptions(fieldName)}
          />
        );
      
      case 'dateDropdown':
        return (
          <DateDropdown
            key={fieldName}
            {...commonProps}
            onChange={handleChange(fieldName)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            key={fieldName}
            {...commonProps}
            onChange={handleChange(fieldName)}
            maxLength={config.maxLength}
            rows={config.rows}
          />
        );
      
      default:
        return null;
    }
  };

  return {
    renderField,
    getFieldValue,
    getFieldProps,
    getFieldOptions
  };
};