export default function PhaseContainer({
  label,
  title,
  children,
  className = "",
}) {
  return (
    <div
      className={`border-2 border-hover-red rounded-3xl p-8 w-full mx-auto ${className}`}
    >
      <div className="text-hover-red bg-white px-4 text-xl -mt-12 font-semibold w-fit">
        {label}
      </div>
      {title && (
        <h1 className="text-4xl font-bold text-primary-red text-left max-w-[400px] mb-4 pl-4 pt-6 leading-snug">
          {title}
        </h1>
      )}
      <div className={`space-y-4 ${!title ? "pt-6" : ""}`}>{children}</div>
    </div>
  );
}
