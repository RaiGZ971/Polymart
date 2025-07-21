export default function Phase3Layout({ renderField }) {
  return (
    <>
      <div className="w-full flex flex-row gap-4">
        <div className="w-1/2">{renderField('studentID')}</div>
        <div className="w-1/2">{renderField('universityBranch')}</div>
      </div>
      
      <div className="w-full flex flex-row gap-4">
        <div className="w-full">{renderField('college')}</div>
      </div>
      
      <div className="w-full flex flex-row gap-4">
        <div className="w-full">{renderField('course')}</div>
      </div>
      
      <div className="w-full flex flex-row gap-4">
        <div className="w-full">{renderField('yearLevel')}</div>
      </div>
    </>
  );
}