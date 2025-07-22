import { useState } from "react";
import { useListingForm } from "../hooks/useListingForm";
import { useListingFieldRenderer } from "../hooks/useListingFieldRenderer";
import { ImageUploader } from "../components";
import { listingFieldConfig } from "../data/listingSchema";
import PUPMap from "../assets/pupmap.png";
import { ChevronLeft } from "lucide-react";
import Modal from "./shared/Modal"; // Adjust the path if needed

export default function CreateListingComponent({ onClose }) {
  const {
    listingData,
    errors,
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
    },
  );

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = () => {
    if (validateForm()) {
      setShowConfirm(true);
    } else {
      console.log("Form has errors:", errors);
    }
  };

  const handleConfirm = () => {
    // Place your submit logic here (e.g., API call)
    setShowConfirm(false);
    onClose?.();
  };

  const handleCancel = () => {
    onClose?.();
  };

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
              Choose your preferred payment method/s
            </h1>
            <h1 className="text-sm text-gray-800 -mb-3">
              Please take note that all payment transactions are made during
              meet ups.
            </h1>
          </div>
          {renderListingField("paymentMethods")}
        </Container>
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
            <div className="w-1/2">
              <img
                src={PUPMap}
                alt="PUP Campus Map"
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
            <div className="w-1/2">
              <h1 className="text-xl text-primary-red font-semibold mb-3">
                Meet Up Locations
              </h1>
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
          {renderListingField("availableDates")}
        </Container>
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
            >
              Cancel
            </button>
          </div>
          <div className="w-[20%]">
            <button
              className="w-full font-semibold bg-primary-red text-white py-2 rounded-full hover:bg-hover-red transition-colors duration-200"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </div>
        {/* Confirmation Modal */}
        <Modal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          type="confirmation"
          title="Submit Listing?"
          description="You're almost done! Please make sure all your product details are correct before submitting. Once submitted, your listing will be sent for review and made visible to other users (if applicable)."
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
