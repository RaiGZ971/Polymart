import { useState } from "react";
import { initialListingData } from "../data/listingSchema";

export const useListingForm = () => {
  const [listingData, setListingData] = useState(initialListingData);
  const [errors, setErrors] = useState({});

  // Handle text field changes
  const handleChange = (fieldName) => (valueOrEvent) => {
    // If it's an event, extract value
    const value =
      valueOrEvent && valueOrEvent.target !== undefined
        ? valueOrEvent.target.value
        : valueOrEvent;

    if (fieldName.includes(".")) {
      const [parent, child] = fieldName.split(".");
      setListingData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setListingData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    }

    // Clear error when user starts typing or changes value
    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }
  };

  // Handle dropdown changes
  const handleDropdownChange = (fieldName) => (selectedOption) => {
    // Extract the value from the dropdown option object
    const value =
      selectedOption?.target?.value || selectedOption?.value || selectedOption;

    setListingData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error when user makes selection
    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }
  };

  // Handle image uploads (max 5)
  const handleImageUpload = (files) => {
    const currentImages = listingData.productImages;
    const newImages = Array.from(files);
    const totalImages = currentImages.length + newImages.length;

    if (totalImages > 5) {
      setErrors((prev) => ({
        ...prev,
        productImages: "Maximum 5 images allowed",
      }));
      return;
    }

    setListingData((prev) => ({
      ...prev,
      productImages: [...prev.productImages, ...newImages],
    }));
  };

  // Remove image
  const removeImage = (index) => {
    setListingData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index),
    }));
  };

  // Update the handleBooleanToggle function to handle value setting
  const handleBooleanToggle = (fieldName, checked) => {
    setListingData((prev) => {
      if (fieldName === "isSingleItem") {
        return {
          ...prev,
          isSingleItem: checked,
          stock: checked ? 1 : prev.stock, // set stock to 1 if checked
        };
      }
      return {
        ...prev,
        [fieldName]: checked,
      };
    });
  };

  // Handle array selections (checkboxes and calendar)
  const handleArraySelection = (fieldName, value, maxSelections = null) => {
    setListingData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error when user makes selection
    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }
  };

  // Reset form
  const resetForm = () => {
    setListingData(initialListingData);
    setErrors({});
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!listingData.productTitle.trim()) {
      newErrors.productTitle = "Product title is required";
    }

    if (!listingData.productDescription.trim()) {
      newErrors.productDescription = "Product description is required";
    }

    if (!listingData.productCategory) {
      newErrors.productCategory = "Category is required";
    }

    if (listingData.productImages.length === 0) {
      newErrors.productImages = "At least one image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    listingData,
    errors,
    handleChange,
    handleDropdownChange,
    handleImageUpload,
    removeImage,
    handleBooleanToggle,
    handleArraySelection,
    resetForm,
    validateForm,
    setListingData,
  };
};
