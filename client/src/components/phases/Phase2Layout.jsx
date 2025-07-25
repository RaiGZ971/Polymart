import React from "react";

export default function Phase2Layout({ renderField, formData, errors }) {
  const password = formData?.password || "";
  const confirmPassword = formData?.confirmPassword || "";
  const passwordMismatch =
    password && confirmPassword && password !== confirmPassword;

  console.log(
    "confirmPassword error:",
    passwordMismatch ? "Passwords do not match" : undefined
  );
  console.log("password:", password);
  console.log("confirmPassword:", confirmPassword);
  console.log("passwordMismatch:", passwordMismatch);

  // Log all input values
  console.log("lastName:", formData?.lastName);
  console.log("firstName:", formData?.firstName);
  console.log("middleName:", formData?.middleName);
  console.log("birthDate:", formData?.birthDate);
  console.log("contactNumber:", formData?.contactNumber);
  console.log("pronouns:", formData?.pronouns);
  console.log("password:", password);
  console.log("confirmPassword:", confirmPassword);

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
