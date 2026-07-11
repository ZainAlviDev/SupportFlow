export function SupportFlowLogo({
  className = "",
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-md ${
          inverted ? "bg-brand-500 text-white" : "bg-charcoal text-white"
        }`}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
          <path
            d="M4.5 8.25C4.5 6.455 5.955 5 7.75 5h8.5C18.045 5 19.5 6.455 19.5 8.25v4.5c0 1.795-1.455 3.25-3.25 3.25h-3.1L9.3 19.1c-.4.3-.98.02-.98-.48V16H7.75C5.955 16 4.5 14.545 4.5 12.75v-4.5Z"
            fill="currentColor"
          />
          <path
            d="M8.25 9.75h7.5M8.25 12.25h4.75"
            stroke={inverted ? "#0d9b6c" : "#121a21"}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className={`text-lg font-bold tracking-tight ${inverted ? "text-white" : "text-charcoal"}`}>
        SupportFlow
      </span>
    </div>
  );
}
