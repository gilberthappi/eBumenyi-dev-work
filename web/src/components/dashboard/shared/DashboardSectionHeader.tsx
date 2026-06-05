import React from "react";

interface DashboardSectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const DashboardSectionHeader: React.FC<DashboardSectionHeaderProps> = ({
  icon,
  title,
  action,
}) => (
  <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-5">
    <div className="flex items-center gap-2">
      <span className="text-[#3363AD]">{icon}</span>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
    {action && (
      <button
        onClick={action.onClick}
        className="text-xs text-[#3363AD] hover:underline flex items-center gap-1"
      >
        {action.label} →
      </button>
    )}
  </div>
);
