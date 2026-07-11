import { type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
  secondary: "bg-line-soft text-ink hover:bg-line",
  outline: "border border-line bg-white text-ink hover:bg-surface-soft",
  ghost: "bg-transparent text-ink-soft hover:bg-line-soft",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
