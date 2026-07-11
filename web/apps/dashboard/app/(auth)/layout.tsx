import { AuthShowcase } from "@/components/auth/AuthShowcase";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-[420px]">{children}</div>
      </div>
      <AuthShowcase />
    </div>
  );
}
