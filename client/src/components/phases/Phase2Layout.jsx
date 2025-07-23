export default function Phase2Layout({ renderField }) {
  return (
    <>
      <div className="w-full flex flex-row gap-4">
        <div className="w-1/3">{renderField("lastName")}</div>
        <div className="w-1/3">{renderField("firstName")}</div>
        <div className="w-1/3">{renderField("middleName")}</div>
      </div>

      <div className="w-full flex flex-row gap-4">
        <div className="w-1/3">{renderField("birthDate")}</div>
        <div className="w-1/3">{renderField("contactNumber")}</div>
        <div className="w-1/3">{renderField("pronouns")}</div>
      </div>

      <div className="w-full flex flex-row gap-4">
        <div className="w-1/2">{renderField("password")}</div>
        <div className="w-1/2">{renderField("confirmPassword")}</div>
      </div>
    </>
  );
}
