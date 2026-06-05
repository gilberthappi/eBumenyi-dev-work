import React from "react";
import { Badge } from "../ui/BadgeDoc";
import { ExportButtons } from "../Documents/ExportButtons";

interface FilterConfig {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

interface StatCard {
  value: string | number;
  label: string;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info";
}

interface PageHeaderProps {
  badgeText?: string;
  badgeVariant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info";

  itemCount?: number;
  itemLabel?: string;

  onExportExcel?: () => void;
  onExportPdf?: () => void;
  showPdfExport?: boolean;

  filters?: FilterConfig[];

  stats?: StatCard[];
}

const PageHeader: React.FC<PageHeaderProps> = ({
  badgeText = "MVP Phase Document",
  badgeVariant = "primary",
  itemCount,
  itemLabel = "items",
  onExportExcel,
  onExportPdf,
  showPdfExport = true,
  filters = [],
  stats = [],
}) => {
  const getStatColor = (variant?: string) => {
    switch (variant) {
      case "success":
        return "text-green-600";
      case "danger":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-gray-900";
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div className='flex items-center space-x-4'>
          <Badge variant={badgeVariant} size='md'>
            {badgeText}
          </Badge>
          {itemCount !== undefined && (
            <span className='text-sm text-gray-500'>
              {itemCount} {itemLabel}
            </span>
          )}
        </div>
      </div>

      {/* Filters + Export toolbar */}
      {(filters.length > 0 || onExportExcel || onExportPdf) && (
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between flex-wrap gap-y-3'>
            <div className='flex items-center space-x-4 flex-wrap gap-y-2'>
              {filters.map((filter, idx) => (
                <div key={idx}>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {filter.label}
                  </label>
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                    aria-label={filter.label}
                  >
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {(onExportExcel || onExportPdf) && (
              <ExportButtons
                onExportExcel={onExportExcel}
                onExportPdf={onExportPdf}
                showPdf={showPdfExport}
              />
            )}
          </div>
        </div>
      )}

      {/* Stats section */}
      {stats.length > 0 && (
        <div
          className={`grid grid-cols-1 md:grid-cols-${Math.min(
            stats.length,
            4,
          )} gap-4`}
        >
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'
            >
              <div className={`text-2xl font-bold ${getStatColor(stat.variant)}`}>
                {stat.value}
              </div>
              <div className='text-sm text-gray-500'>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
