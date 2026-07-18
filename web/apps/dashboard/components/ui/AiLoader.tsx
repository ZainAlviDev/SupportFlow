"use client";

type AiLoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  /** Centers the loader in a full-height flex container. */
  fullScreen?: boolean;
};

const SIZES = {
  sm: { ring: "h-8 w-8", spark: "h-3.5 w-3.5", dot: "h-1 w-1" },
  md: { ring: "h-12 w-12", spark: "h-5 w-5", dot: "h-1.5 w-1.5" },
  lg: { ring: "h-16 w-16", spark: "h-7 w-7", dot: "h-2 w-2" },
} as const;

function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.5 13.8 9 20 10.8 13.8 12.6 12 19 10.2 12.6 4 10.8 10.2 9 12 2.5Z" />
      <path d="M19 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z" opacity="0.7" />
    </svg>
  );
}

/** Branded AI-style loader: orbiting ring + breathing spark + shimmer label. */
export function AiLoader({ label, size = "md", fullScreen = false }: AiLoaderProps) {
  const s = SIZES[size];

  const loader = (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <div className={`relative ${s.ring}`}>
        {/* Outer orbit ring */}
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-brand-500/15 border-t-brand-500 [animation-duration:1.1s]" />
        {/* Counter orbit with trailing dot */}
        <span className="absolute inset-1 animate-spin [animation-direction:reverse] [animation-duration:1.8s]">
          <span
            className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-brand-400 ${s.dot}`}
          />
        </span>
        {/* Breathing spark core */}
        <span className="absolute inset-0 flex items-center justify-center text-brand-500 [animation:sf-breathe_1.6s_ease-in-out_infinite]">
          <Spark className={s.spark} />
        </span>
      </div>
      {label && <p className="sf-shimmer-text text-xs font-semibold">{label}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[inherit] flex-1 items-center justify-center py-16">
        {loader}
      </div>
    );
  }

  return loader;
}
