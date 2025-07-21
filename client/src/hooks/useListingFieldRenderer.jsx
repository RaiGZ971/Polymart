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

    // Custom rendering for price and stock
    if (fieldName === "price") {
      return (
        <div key="price" className="flex flex-col gap-2">
          {listingData.hasPriceRange ? (
            <div className="flex gap-2">
              <Textfield
                label="Min Price"
                value={listingData.priceRange?.min || ""}
                onChange={handleChange("priceRange.min")}
                type="number"
                min={1}
                required
                integerOnly
              />
              <Textfield
                label="Max Price"
                value={listingData.priceRange?.max || ""}
                onChange={handleChange("priceRange.max")}
                type="number"
                min={1}
                required
                integerOnly
              />
            </div>
          ) : (
            <Textfield
              label={config.label}
              value={listingData.price}
              onChange={handleChange("price")}
              type="number"
              min={1}
              required
              integerOnly
            />
          )}
          {renderListingField("hasPriceRange")}
        </div>
      );
    }

    if (fieldName === "stock") {
      return (
        <div key="stock" className="flex flex-col gap-2">
          <Textfield
            label={config.label}
            value={listingData.stock}
            onChange={handleChange("stock")}
            type="number"
            min={1}
            required
            disabled={listingData.isSingleItem}
          />

          <Checkbox
            id="isSingleItem"
            label="Single-item product"
            checked={listingData.isSingleItem}
            onChange={(e) => handleBooleanToggle("isSingleItem", e.target.checked)}
          />
        </div>
      );
    }

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
        // Support multiple selections (array) for toggles
        const value = getFieldValue(fieldName);
        const isArray = Array.isArray(value);
        return (
          <div key={fieldName} className="flex gap-2 flex-wrap">
            {config.options?.map((option) => {
              const isActive = isArray
                ? value.includes(option.value)
                : value === option.value;
              return (
                <ToggleButton
                  key={option.value}
                  label={option.label}
                  isActive={isActive}
                  onClick={() => {
                    if (isArray) {
                      // Toggle value in array
                      let newValue = value.includes(option.value)
                        ? value.filter((v) => v !== option.value)
                        : [...value, option.value];
                      // Respect maxSelections if set
                      if (config.maxSelections && newValue.length > config.maxSelections) {
                        return;
                      }
                      handleArraySelection(fieldName, newValue, config.maxSelections);
                    } else {
                      handleBooleanToggle && handleBooleanToggle(fieldName, option.value);
                    }
                  }}
                />
              );
            })}
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