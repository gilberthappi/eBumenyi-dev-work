import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;        // Tailwind bg class e.g. "bg-blue-50"
  iconColor?: string;     // Tailwind text class e.g. "text-[#3363AD]"
  trend?: {
    value: number;
    direction: "up" | "down" | "stable";
  };
  description?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  iconBg = "bg-blue-50",
  iconColor = "text-[#3363AD]",
  trend,
  description,
}) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4
    hover:shadow-sm transition-shadow duration-200 flex flex-col gap-2">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
        shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      {trend && (
        <div className={`flex items-center gap-0.5 text-xs font-medium ${
          trend.direction === "up"
            ? "text-green-600"
            : trend.direction === "down"
            ? "text-red-500"
            : "text-gray-400"
        }`}>
          {trend.direction === "up" && <TrendingUp size={12} />}
          {trend.direction === "down" && <TrendingDown size={12} />}
          {trend.direction === "stable" && <Minus size={12} />}
          {trend.direction !== "stable" && `${trend.value}%`}
        </div>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
  </div>
);
