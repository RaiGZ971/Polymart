import { FileUploadArea } from "..";

export default function Phase5Layout({ 
  step5SubStep, 
  formData, 
  handleFileChange, 
  removeFile 
}) {
  return (
    <>
      {step5SubStep === 1 && (
        <FileUploadArea
          file={formData.cor}
          onFileChange={handleFileChange('cor')}
          onRemove={() => removeFile('cor')}
          inputId="cor-file-input"
          acceptTypes="image/*,.pdf"
          title="Upload your Certificate of Registration"
          subtitle="Please upload a clear photo of your Certificate of Registration"
          buttonText="Click to upload COR"
          allowedFormats="jpg, jpeg, png, or pdf"
        />
      )}
      
      {step5SubStep === 2 && (
        <div className="w-full flex-1 flex flex-col gap-6">
          <div className="text-left space-y-1 pl-4">
            <div className="text-xl text-gray-800 font-semibold">Upload your Student ID Pictures</div>
            <span className="italic text-gray-400 text-base">Please upload clear photos of both sides of your Student ID</span>
          </div>
          
          <div className="flex flex-row gap-6">
            <div className="w-1/2">
              <FileUploadArea
                file={formData.studentIdFront}
                onFileChange={handleFileChange('studentIdFront')}
                onRemove={() => removeFile('studentIdFront')}
                inputId="student-id-front-input"
                acceptTypes="image/*"
                title="Front Side"
                subtitle="Upload the front side of your Student ID"
                buttonText="Click to upload front side"
                allowedFormats="jpg, jpeg, or png"
              />
            </div>
            
            <div className="w-1/2">
              <FileUploadArea
                file={formData.studentIdBack}
                onFileChange={handleFileChange('studentIdBack')}
                onRemove={() => removeFile('studentIdBack')}
                inputId="student-id-back-input"
                acceptTypes="image/*"
                title="Back Side"
                subtitle="Upload the back side of your Student ID"
                buttonText="Click to upload back side"
                allowedFormats="jpg, jpeg, or png"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}