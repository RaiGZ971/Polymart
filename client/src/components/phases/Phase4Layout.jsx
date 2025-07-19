import { ProfilePictureUpload } from "..";

export default function Phase4Layout({ formData, handleFileChange, removeFile, renderField }) {
  return (
    <>
      <div className="w-full flex-1 flex flex-row gap-4">
        <ProfilePictureUpload
          profilePicture={formData.profilePicture}
          onFileChange={handleFileChange('profilePicture')}
          onRemove={() => removeFile('profilePicture')}
        />
        
        <div className="w-1/2 flex-1 flex flex-col gap-4 text-left">
          <div className="w-full text-lg text-gray-800 font-semibold">Profile Details</div>
          <div className="w-full">
            {renderField('username')}
          </div>
          <div className="w-full flex-1">
            {renderField('bio')}
          </div>
        </div>
      </div>  
    </>
  );
}