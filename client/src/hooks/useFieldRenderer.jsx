import { Textfield, PasswordField, Dropdown, DateDropdown, Textarea } from "../components";

export const useFieldRenderer = (formData, fieldConfig, handlers) => {
  const { handleChange, handleDropdownChange, handleFileChange, setFormData } =
    handlers;

  // Helper function to get field value with auto-formatting
  const getFieldValue = (fieldName) => {
    const value = formData[fieldName] || "";
    return value;
  };

  // Helper function to get field props
  const getFieldProps = (fieldName) => {
    const config = fieldConfig[fieldName] || {};
    return {
      required: config.required,
      integerOnly: config.integerOnly,
      studID: config.studID,
      type: config.type === "password" ? "password" : undefined,
      validation: config.validation,
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

  // Example: update formData directly in a custom change handler
  const customHandleChange = (field) => (e) => {
    let value = e.target.value;
    const config = fieldConfig[field] || {};
    
    // Apply uppercase transformation if configured (for fields like student ID)
    if (config.uppercase && typeof value === "string") {
      value = value.toUpperCase();
    }
    
    // Trim whitespace for all text fields when user finishes typing
    // Note: We only trim on blur, not on every keystroke to preserve user experience
    
    if (setFormData) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
    if (handleChange) {
      // Create a modified event with the transformed value
      const modifiedEvent = {
        ...e,
        target: {
          ...e.target,
          value: value
        }
      };
      handleChange(field)(modifiedEvent);
    }
  };

  // Handle blur event to trim whitespace
  const customHandleBlur = (field) => (e) => {
    let value = e.target.value;
    const config = fieldConfig[field] || {};
    
    // Always trim whitespace on blur
    if (typeof value === "string") {
      value = value.trim();
      
      // Apply uppercase transformation if configured (for fields like student ID)
      if (config.uppercase) {
        value = value.toUpperCase();
      }
    }
    
    if (setFormData) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Main render function using configuration
  const renderField = (fieldName, extraProps = {}) => {
    const config = fieldConfig[fieldName];
    if (!config) return null;

    const commonProps = {
      label: config.label,
      value:
        config.component === "textfield"
          ? getFieldValue(fieldName)
          : formData[fieldName],
      required: config.required,
      disabled: config.disabled,
      ...extraProps,
    };

    switch (config.component) {
      case "textfield":
        // Use PasswordField for password type fields
        if (config.type === "password") {
          return (
            <PasswordField
              key={fieldName}
              {...commonProps}
              name={fieldName}
              error={extraProps.error}
              onChange={customHandleChange(fieldName)}
              onBlur={customHandleBlur(fieldName)}
              required={config.required}
            />
          );
        }
        
        return (
          <Textfield
            key={fieldName}
            {...commonProps}
            error={extraProps.error}
            onChange={customHandleChange(fieldName)} // use custom handler
            onBlur={customHandleBlur(fieldName)} // add blur handler for trimming
            {...getFieldProps(fieldName)}
          />
        );

      case "dropdown":
        return (
          <Dropdown
            key={fieldName}
            {...commonProps}
            onChange={handleDropdownChange(fieldName)}
            options={getFieldOptions(fieldName)}
          />
        );

      case "dateDropdown":
        return (
          <DateDropdown
            key={fieldName}
            {...commonProps}
            onChange={handleChange(fieldName)}
          />
        );

      case "textarea":
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
    getFieldOptions,
    customHandleBlur
  };
};
