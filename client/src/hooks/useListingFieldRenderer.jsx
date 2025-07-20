import { Textfield, Dropdown, Textarea, ToggleButton, Checkbox, CalendarPicker } from "../components";

export const useListingFieldRenderer = (listingData, listingFieldConfig, handlers) => {
  const { handleChange, handleDropdownChange, handleBooleanToggle, handleArraySelection } = handlers;

  // Helper function to get field value
  const getFieldValue = (fieldName) => {
    return listingData[fieldName] || "";
  };

  // Helper function to get field options
  const getFieldOptions = (fieldName) => {
    const config = listingFieldConfig[fieldName] || {};
    return config.options || [];
  };

  // Main render function using configuration
  const renderListingField = (fieldName) => {
    const config = listingFieldConfig[fieldName];
    if (!config) return null;

    const commonProps = {
      label: config.label,
      value: getFieldValue(fieldName),
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
            type={config.type}
            maxLength={config.maxLength}
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

      case 'checkbox':
        // Handle multiple checkbox options (like meetup locations)
        if (config.options && config.options.length > 0) {
          return (
            <Checkbox
              key={fieldName}
              id={fieldName}
              label={config.label}
              checked={listingData[fieldName] || []}
              onChange={(e) => handleArraySelection && handleArraySelection(fieldName, e.target.value)}
              options={config.options}
              disabled={config.disabled}
            />
          );
        }
        // Single checkbox
        return (
          <Checkbox
            key={fieldName}
            id={fieldName}
            label={config.label}
            checked={Boolean(getFieldValue(fieldName))}
            onChange={(e) => handleBooleanToggle && handleBooleanToggle(fieldName, e.target.checked)}
            disabled={config.disabled}
          />
        );

      case 'toggle':
        return (
          <div key={fieldName} className="flex gap-2">
            {config.options?.map((option) => (
              <ToggleButton
                key={option.value}
                label={option.label}
                isActive={getFieldValue(fieldName) === option.value}
                onClick={() => handleBooleanToggle && handleBooleanToggle(fieldName, option.value)}
              />
            ))}
          </div>
        );

      case 'calendar':
        return (
          <CalendarPicker
            key={fieldName}
            label={config.label}
            value={listingData[fieldName] || []}
            onChange={(e) => {
              // Handle calendar's direct array update
              const { handleChange, handleDropdownChange, handleBooleanToggle, handleArraySelection } = handlers;
              if (handleArraySelection) {
                handleArraySelection(fieldName, e.target.value);
              }
            }}
            timeSlots={config.timeSlots || []}
            disabled={config.disabled}
          />
        );
      
      default:
        return null;
    }
  };

  return {
    renderListingField,
    getFieldValue,
    getFieldOptions
  };
};