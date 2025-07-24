export default function PhaseIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((label, index) => {
        const step = index + 1;
        const isPassed = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div className="flex items-center font-montserrat " key={step}>
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-bold
                  ${isCurrent ? "bg-hover-red text-white border-hover-red" : ""}
                  ${isPassed ? "bg-white text-hover-red border-hover-red" : ""}
                  ${!isPassed && !isCurrent ? "bg-white text-gray-300 border-gray-300" : ""}
                `}
              >
                {step}
              </div>
              <div
                className={`
                  text-xs text-center w-20
                  ${isCurrent ? "text-hover-red" : ""}
                  ${isPassed ? "text-hover-red" : ""}
                  ${!isPassed && !isCurrent ? "text-gray-300" : ""}
                `}
              >
                {label}
              </div>
            </div>

            {step !== steps.length && (
              <div className="flex-1 flex items-center justify-center -mt-8">
                <div
                  className={`
                    w-10 h-0.5
                    ${isPassed ? "bg-hover-red" : "bg-gray-300"}
                  `}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
