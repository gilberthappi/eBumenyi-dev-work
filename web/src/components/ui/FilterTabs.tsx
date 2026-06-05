import { FC } from "react";

// Utility class for consistent transitions
const transitionClass = "transition-all duration-500 ease-in-out";

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  className?: string;
  variant?: "default" | "pills" | "cards";
  size?: "sm" | "md" | "lg";
}

const FilterTabs: FC<TabsProps> = ({
  items,
  activeTab,
  onTabChange,
  className = "",
  variant = "default",
  size = "md",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-sm py-2";
      case "lg":
        return "text-lg py-4";
      default:
        return "text-base py-3";
    }
  };

  const getVariantClasses = (item: TabItem, isActive: boolean) => {
    const baseClasses = `cursor-pointer relative ${transitionClass} ${getSizeClasses()}`;
    
    if (item.disabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed text-gray-400`;
    }

    switch (variant) {
      case "pills":
        return `${baseClasses} px-4 rounded-full ${
          isActive
            ? "bg-[#4d81d2] text-white"
            : "text-[#333333] hover:bg-gray-100 hover:text-[#4d81d2]"
        }`;
      
      case "cards":
        return `${baseClasses} px-4 rounded-lg border ${
          isActive
            ? "border-[#4d81d2] bg-[#4d81d2]/10 text-[#4d81d2] font-semibold"
            : "border-gray-200 text-[#333333] hover:border-[#4d81d2] hover:text-[#4d81d2]"
        }`;
      
      default:
        return `${baseClasses} ${
          isActive
            ? "border-b-2 border-[#4d81d2] text-[#4d81d2] font-semibold"
            : "text-[#333333] hover:text-[#4d81d2]"
        }`;
    }
  };

  const containerClasses = () => {
    switch (variant) {
      case "pills":
        return "flex items-center gap-2 flex-wrap";
      case "cards":
        return "flex items-center gap-3 flex-wrap";
      default:
        return "flex items-center gap-6 border-b border-[#cccccc]/50 font-medium";
    }
  };

  return (
    <ul className={`${containerClasses()} ${className}`}>
      {items.map((item) => {
        const isActive = activeTab === item.key;
        
        return (
          <li
            key={item.key}
            onClick={() => !item.disabled && onTabChange(item.key)}
            className={getVariantClasses(item, isActive)}
          >
            <span className="flex items-center gap-2">
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isActive
                      ? variant === "pills"
                        ? "bg-white/20 text-white"
                        : "bg-[#4d81d2] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default FilterTabs;
