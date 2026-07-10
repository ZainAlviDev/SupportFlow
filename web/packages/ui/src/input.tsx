import { type InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 ${className}`}
      {...props}
    />
  );
}
