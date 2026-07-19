import { AiLoader } from "@/components/ui/AiLoader";

export default function DashboardLoading() {
  return (
    <div className="flex justify-center py-16">
      <AiLoader label="Loading" />
    </div>
  );
}
