import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "stable";
  };
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
}) => {
  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.direction === "up") return "text-green-600";
    if (trend.direction === "down") return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === "up") return <TrendingUp size={16} />;
    if (trend.direction === "down") return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#3363AD]/10 text-[#3363AD]">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
};
