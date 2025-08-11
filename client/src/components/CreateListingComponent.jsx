import { useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useListingForm } from "../hooks/useListingForm";
import { useListingFieldRenderer } from "../hooks/useListingFieldRenderer";
import { ImageUploader } from "../components";
import { listingFieldConfig } from "../data/listingSchema";
import { transformListingDataForAPI, validateListingData } from "../utils/listingTransform";
import { ListingService } from "../services/listingService";
import { listingKeys } from "../hooks/queries/useListingQueries";
import PUPMap from "../assets/pupmap.png";
import meetUpLocations from "../data/meetUpLocations";
import { ChevronLeft } from "lucide-react";
import Modal from "./shared/Modal";

export default function CreateListingComponent({ onClose }) {
  const queryClient = useQueryClient();
  const {
    listingData,
    errors,
    setErrors,
    handleChange,
    handleDropdownChange,
    handleImageUpload,
    removeImage,
    handleBooleanToggle,
    handleArraySelection,
    validateForm,
  } = useListingForm();

  const { renderListingField } = useListingFieldRenderer(
    listingData,
    listingFieldConfig,
    {
      handleChange,
      handleDropdownChange,
      handleBooleanToggle,
      handleArraySelection,
    }
  );

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = () => {
    // Use the enhanced validation
    const validation = validateListingData(listingData);
    
    if (validation.isValid) {
      setSubmitError(null);
      setShowConfirm(true);
    } else {
      // Update errors state with validation errors
      setErrors(validation.errors);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Transform the frontend data to backend format
      const transformedData = transformListingDataForAPI(listingData);
      
      // Create listing with images
      const result = await ListingService.createListingWithImages(
        transformedData,
        listingData.productImages
      );
      
      if (result.success) {
        // Close confirmation modal and show success modal
        setShowConfirm(false);
        setShowSuccess(true);

  // Immediately refresh any listings queries so UI shows latest data
  // This invalidates all queries starting with ['listings'] which includes
  // public listings and the authenticated user's listings.
  await queryClient.invalidateQueries({ queryKey: listingKeys.all });
        
        // Check if image upload had issues
        if (result.data.images && !result.data.images.success) {
          console.warn('Listing created but image upload failed:', result.data.images.error);
        }
      } else {
        throw new Error(result.message || 'Failed to create listing');
      }
      
    } catch (error) {
      console.error('Failed to submit listing:', error);
      setSubmitError(error.message || 'Failed to create listing. Please try again.');
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccess(false);
    onClose?.();
  };

  const handleCancel = () => {
    onClose?.();
  };

  // Disable meet-up related fields if transaction method is 'online'
  const isOnlineOnly =
    Array.isArray(listingData.transactionMethods) &&
    listingData.transactionMethods.length === 1 &&
    listingData.transactionMethods[0] === "Online";

  return (
    <div className="w-full max-w-4xl bg-white rounded-xl shadow-glow p-8 relative">
      <div className="space-y-6">
        <div className="flex flex-row items-center justify-between px-2 pt-4 pb-6">
          <button
            className="flex items-center gap-2 text-gray-400 hover:text-primary-red text-lg font-medium"
            onClick={onClose}
            aria-label="Back"
          >
            <ChevronLeft size={24} />
            Back
          </button>
          <h1 className="text-4xl text-primary-red font-bold text-center flex-1">
            Create New Listing
          </h1>
          {/* Empty div for spacing to keep header centered */}
          <div style={{ width: "80px" }} />
        </div>
        <Container>
          <div>
            <h1 className="text-xl text-primary-red font-semibold">
              Enter Product Details
            </h1>
            <p className="text-sm text-gray-500">
              Provide all necessary information about your product.
            </p>
          </div>
          <ImageUploader
            images={listingData.productImages}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
            maxImages={5}
            error={errors.productImages}
          />
          <div>
            <h1 className="text-base text-gray-800 font-bold -mb-3">
              Product Specification
            </h1>
          </div>
          {renderListingField("productTitle")}
          {renderListingField("productDescription")}
          <div className="w-full flex flex-row gap-4">
            <div className="w-1/2">{renderListingField("productCategory")}</div>
            <div className="w-1/2">{renderListingField("productTags")}</div>
          </div>
          <div className="w-full flex flex-row gap-4">
            {renderListingField("price")}
            {renderListingField("stock")}
          </div>
        </Container>
        <Container>
          <div>
            <h1 className="text-xl text-primary-red font-semibold">
              Choose your preferred transaction method
            </h1>
            <h1 className="text-sm text-gray-800 -mb-3">
              Continue by scheduling a meet-up (within campus only) or proceed
              with an online transaction.
            </h1>
          </div>
          {renderListingField("transactionMethods")}
        </Container>
        <Container>
          <div>
            <h1 className="text-xl text-primary-red font-semibold">
              Choose your preferred payment method
            </h1>
            <h1 className="text-sm text-gray-800 -mb-3">
              All payments happen outside the app (either during meet-ups or through chat arrangements).
            </h1>
          </div>
          {renderListingField("paymentMethods", {
            filteredOptions: isOnlineOnly 
              ? ['GCash', 'Maya', 'Bank Transfer', 'Remittance']
              : null
          })}
        </Container>
        {!isOnlineOnly && (
          <>
            <Container>
              <h1 className="text-xl text-primary-red font-semibold -mb-6">
                Choose your preferred meet-up location/s
              </h1>
              <h1 className="text-sm text-gray-800 ">
                Here are the common campus locations where meet-ups usually happen.
                <br /> <br /> Please select all the places you're comfortable
                meeting at:
              </h1>
              <div className="w-full gap-12 flex flex-row justify-between">
                <div className="w-2/3">
                  <img
                    src={PUPMap}
                    alt="PUP Campus Map"
                    className="w-full h-auto rounded-2xl shadow-md"
                  />
                </div>
                <div className="w-1/3">
                  <h1 className="text-xl text-primary-red font-semibold mb-3">
                    Meet Up Locations
                  </h1>
                  
                  {/* Select All Checkbox */}
                  <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg border">
                    <input
                      type="checkbox"
                      id="selectAllLocations"
                      checked={(() => {
                        const allLocations = meetUpLocations.map(loc => loc.value);
                        const currentLocations = listingData.meetupLocations || [];
                        return allLocations.every(location => 
                          currentLocations.includes(location)
                        );
                      })()}
                      onChange={(e) => {
                        const allLocations = meetUpLocations.map(loc => loc.value);
                        
                        if (e.target.checked) {
                          // Select all
                          handleArraySelection("meetupLocations", allLocations);
                        } else {
                          // Deselect all
                          handleArraySelection("meetupLocations", []);
                        }
                      }}
                      className="w-4 h-4 text-primary-red bg-gray-100 border-gray-300 rounded focus:ring-primary-red focus:ring-2"
                    />
                    <label 
                      htmlFor="selectAllLocations" 
                      className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Select All Locations
                    </label>
                  </div>
                  
                  {renderListingField("meetupLocations")}
                </div>
              </div>
            </Container>
            <Container>
              <h1 className="text-xl text-primary-red font-semibold -mb-6">
                Choose available dates for meet-up/s
              </h1>
              <h1 className="text-sm text-gray-800 ">
                Select the date and time that best fits your schedule for the
                meet-ups.
              </h1>
              {renderListingField("availableSchedules")}
            </Container>
          </>
        )}
        <Container>
          <h1 className="text-xl text-primary-red font-semibold -mb-6">
            Remark (Optional)
          </h1>
          <h1 className="text-sm text-gray-800 ">
            Leave a remark regarding product or meet up.
          </h1>
          {renderListingField("remark")}
        </Container>
        <div className="w-full flex flex-row gap-4 justify-end">
          <div className="w-[20%]">
            <button
              className="w-full text-primary-red font-semibold py-2 border-2 border-primary-red rounded-full hover:bg-primary-red hover:border-none hover:text-white transition-colors duration-200"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
          <div className="w-[20%]">
            <button
              className="w-full font-semibold bg-primary-red text-white py-2 rounded-full hover:bg-hover-red transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
        
        {/* Error Message */}
        {submitError && (
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        )}
        
        <Modal
          isOpen={showConfirm}
          onClose={() => !isSubmitting && setShowConfirm(false)}
          onConfirm={handleConfirm}
          type="confirmation"
          title="Submit Listing?"
          description="You're almost done! Please make sure all your product details are correct before submitting. Once submitted, your listing will be sent for review and made visible to other users (if applicable)."
          confirmText={isSubmitting ? "Submitting..." : "Submit"}
          disabled={isSubmitting}
        />
        
        <Modal
          isOpen={showSuccess}
          onClose={handleSuccessConfirm}
          onConfirm={handleSuccessConfirm}
          type="alert"
          title="Listing Submitted!"
          description="Your listing has been successfully submitted and is now under review. You will be notified once it's approved and visible to other users."
        />
      </div>
    </div>
  );
}

const Container = ({ children }) => (
  <div className="w-full relative rounded-xl bg-white shadow-light flex flex-col text-left justify-center items-center">
    <div className="w-full space-y-6 px-10 py-8">{children}</div>
  </div>
);
