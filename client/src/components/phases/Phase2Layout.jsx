import React from "react";

export default function Phase2Layout({ renderField, formData, errors }) {
  const password = formData?.password || "";
  const confirmPassword = formData?.confirmPassword || "";
  const passwordMismatch =
    password && confirmPassword && password !== confirmPassword;

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
        <div className="w-1/2">
          {renderField("confirmPassword", {
            error: errors?.confirmPassword,
          })}
        </div>
      </div>
    </>
  );
}
