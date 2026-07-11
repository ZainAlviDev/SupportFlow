import { type InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${className}`}
      {...props}
    />
  );
}
