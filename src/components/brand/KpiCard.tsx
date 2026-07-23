import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: number;
  className?: string;
}

export function KpiCard({ label, value, subtext, trend, className }: KpiCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden", className)}>
      {/* Brand gradient left-border accent */}
      <div
        className="absolute start-0 top-0 bottom-0 w-[3px] rounded-s-xl"
        style={{ background: "linear-gradient(180deg, #00FFD1 0%, #7B61FF 100%)" }}
      />
      <p className="type-label text-gray-500 ps-3">{label}</p>
      <p className="text-[2rem] font-bold text-gray-950 leading-none mt-2 ps-3">{value}</p>
      {subtext && <p className="type-small text-gray-400 mt-1 ps-3">{subtext}</p>}
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 mt-2 ps-3 type-small", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}
