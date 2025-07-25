import { Textfield, Dropdown, DateDropdown, Textarea } from "../components";

export const useFieldRenderer = (formData, fieldConfig, handlers) => {
  const { handleChange, handleDropdownChange, handleFileChange, setFormData } =
    handlers;

  // Helper function to get field value with auto-formatting
  const getFieldValue = (fieldName) => {
    const config = fieldConfig[fieldName] || {};
    const value = formData[fieldName] || "";

    // Apply uppercase if configured
    if (config.uppercase && typeof value === "string") {
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
      type: config.type === "password" ? "password" : undefined,
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
    const value = e.target.value;
    if (setFormData) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
    if (handleChange) {
      handleChange(field)(e);
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
        return (
          <Textfield
            key={fieldName}
            {...commonProps}
            error={extraProps.error}
            onChange={customHandleChange(fieldName)} // use custom handler
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
  };
};
