import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "stable";
  };
  description?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  iconBg = "bg-[#6366F1]",
  iconColor = "text-white",
  trend,
  description,
}) => {
  const trendStyles = {
    up: "bg-emerald-100 text-emerald-700",
    down: "bg-rose-100 text-rose-600",
    stable: "bg-gray-100 text-gray-500",
  } as const;

  return (
    <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div
            className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}
          >
            <span className={`${iconColor} flex items-center justify-center`}>
              {icon}
            </span>
          </div>

          <div>
            <p className='text-sm font-medium text-gray-600'>{title}</p>
            <p className='text-3xl font-extrabold text-gray-900 mt-1'>{value}</p>
          </div>
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${trendStyles[trend.direction]}`}
          >
            {trend.direction === "up" && <TrendingUp size={14} />}
            {trend.direction === "down" && <TrendingDown size={14} />}
            {trend.direction === "stable" && <Minus size={14} />}
            <span>
              {trend.direction === "up"
                ? `+${trend.value}%`
                : trend.direction === "down"
                  ? `-${trend.value}%`
                  : `${trend.value}%`}
            </span>
          </div>
        )}
      </div>

      {description && <p className='text-xs text-gray-400 mt-3'>{description}</p>}
    </div>
  );
};
