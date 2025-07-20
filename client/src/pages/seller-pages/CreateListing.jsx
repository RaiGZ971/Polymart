import { NavigationDashboard } from "../../components";
import { useListingForm } from "../../hooks/useListingForm";
import { useListingFieldRenderer } from "../../hooks/useListingFieldRenderer";
import { ImageUploader } from "../../components";
import { listingFieldConfig } from "../../data/listingSchema";
import { useState } from "react";
import PUPMap from "../../assets/pupmap.png";

export default function CreateListing() {
    const [isActive, setIsActive] = useState(false);
    
    const {
        listingData,
        errors,
        handleChange,
        handleDropdownChange,
        handleImageUpload,
        removeImage,
        handleBooleanToggle,
        handleArraySelection,
        validateForm
    } = useListingForm();

    const { renderListingField } = useListingFieldRenderer(
        listingData,
        listingFieldConfig,
        {
            handleChange,
            handleDropdownChange,
            handleBooleanToggle,
            handleArraySelection
        }
    );

    const handleSubmit = () => {
        if (validateForm()) {
            console.log('Form is valid, submitting:', listingData);
            setIsActive(true);
        } else {
            console.log('Form has errors:', errors);
        }
    };

    return(
        <>
        <div className='w-full min-h-screen bg-white flex flex-col items-center'>
            <div className="w-full px-0 mx-0">
                <NavigationDashboard/>
            </div>

            <div className="w-[80%] space-y-6 mt-10 pb-10">
                <div className="mb-6 flex flex-row justify-center">
                    <h1 className="text-4xl text-primary-red font-bold">Create New Listing</h1>
                </div>
                
                <Container>
                    <div>
                        <h1 className="text-xl text-primary-red font-semibold">Enter Product Details</h1>
                        <p className="text-sm text-gray-500">Provide all necessary information about your product.</p>
                    </div>

                    <ImageUploader
                        images={listingData.productImages}
                        onImageUpload={handleImageUpload}
                        onRemoveImage={removeImage}
                        maxImages={5}
                        error={errors.productImages}
                    />
                    <div>
                        <h1 className="text-base text-gray-800 font-bold -mb-3">Product Specification</h1>
                    </div>
                    {renderListingField('productTitle')}
                    {renderListingField('productDescription')}
                    
                    <div className="w-full flex flex-row gap-4">
                        <div className="w-1/2">
                            {renderListingField('productCategory')}
                        </div>
                        <div className="w-1/2">
                        {renderListingField('productTags')}
                        </div>
                    </div>
                    <div className="w-full flex flex-row gap-4">
                        {renderListingField('price')}
                        {renderListingField('stock')}
                    </div>
                </Container>

                <Container>
                    <div>
                        <h1 className="text-xl text-primary-red font-semibold">Choose your preferred transaction method</h1>
                        <h1 className="text-sm text-gray-800 -mb-3">Continue by scheduling a meet-up (within campus only) or proceed with an online transaction.</h1>
                    </div>
                    {renderListingField('transactionMethods')}
                </Container>

                <Container>
                    <div>
                        <h1 className="text-xl text-primary-red font-semibold">Choose your preferred payment method</h1>
                        <h1 className="text-sm text-gray-800 -mb-3">Please take note that all payment transactions are made during meet ups.</h1>
                    </div>
                    {renderListingField('paymentMethods')}
                </Container>

                <Container>
                    <h1 className="text-xl text-primary-red font-semibold -mb-6">Choose your preferred meet-up locations</h1>
                        <h1 className="text-sm text-gray-800 ">Here are the common campus locations where meet-ups usually happen.<br/> <br/> Please select all the places you're comfortable meeting at:</h1>
                    <div className="w-full gap-12 flex flex-row justify-between">
                    <div className="w-1/2">
                         <img 
                                src={PUPMap}
                                alt="PUP Campus Map" 
                                className="w-full h-auto rounded-lg shadow-md"
                            />
                    </div>
                    <div className="w-1/2">
                        <h1 className="text-xl text-primary-red font-semibold mb-3">Meet Up Locations</h1>
                        {renderListingField('meetupLocations')}
                    </div>
                    </div>
                </Container>

                <Container>
                    <h1 className="text-xl text-primary-red font-semibold -mb-6">Choose available dates for meet-ups</h1>
                    <h1 className="text-sm text-gray-800 ">Select the date and time that best fits your schedule for the meet-ups.</h1>
                    {renderListingField('availableDates')}
                </Container>

                <Container>
                    <h1 className="text-xl text-primary-red font-semibold -mb-6">Remark (Optional)</h1>
                    <h1 className="text-sm text-gray-800 ">Leave a remark regarding product or meet up.</h1>
                    {renderListingField('remark')}
                </Container>

                <div className="w-[20%] flex flex-row">
                
                <button
                    className="w-full bg-primary-red text-white py-3 rounded-full hover:bg-hover-red transition-colors duration-200"
                    onClick={handleSubmit}
                >
                    Submit Listing
                </button>
                </div>
                        
            </div>
        </div>
        </>
    );
}



const Container = ({ children }) => {
    return (
        <div className="w-full relative rounded-xl bg-white shadow-glow flex flex-col text-left justify-center items-center">
            <div className="w-full space-y-6 px-10 py-8">
                {children}
            </div>
        </div>
    );
}
