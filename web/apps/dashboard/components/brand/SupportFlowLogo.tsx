import Image from "next/image";

type SupportFlowLogoProps = {
  className?: string;
  /**
   * full — stacked artwork (icon + wordmark), for auth pages.
   * compact — small icon + text lockup, for the app chrome.
   */
  variant?: "full" | "compact";
  inverted?: boolean;
};

/** Official SupportFlow logo. Artwork lives in /public/brand/. */
export function SupportFlowLogo({
  className = "",
  variant = "full",
  inverted = false,
}: SupportFlowLogoProps) {
  if (variant === "compact") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <Image
          src="/brand/logo-icon.png"
          alt=""
          width={38}
          height={25}
          priority
          className="h-6 w-auto object-contain"
        />
        <span
          className={`text-[15px] font-bold tracking-tight ${
            inverted ? "text-white" : "text-charcoal dark:text-white"
          }`}
        >
          Support<span className="text-brand-500">Flow</span>
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/brand/logo.png"
        alt="SupportFlow"
        width={90}
        height={70}
        priority
        className="h-14 w-auto object-contain"
      />
    </span>
  );
}
