import React from "react";
import { Filter, X } from "lucide-react";
import { IDashboardFilters } from "@/types";

interface GlobalFilterBarProps {
  filters: IDashboardFilters;
  onChange: (filters: IDashboardFilters) => void;
  provinces: string[];
  districts: string[];
  genders: string[];
  years: string[];
  months: string[];
}

const EMPTY: IDashboardFilters = {
  province: "", district: "", gender: "", role: "", year: "", month: "",
};

const ROLE_LABELS: Record<string, string> = {
  TRAINEE: "CHW",
  TESTER: "Tester",
};

const SelectFilter: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`text-xs border rounded px-1.5 py-0.5 focus:outline-none
      focus:ring-1 focus:ring-[#3363AD] bg-white transition-colors min-w-[70px] ${
      value
        ? "border-[#3363AD] text-[#3363AD] font-medium"
        : "border-gray-200 text-gray-600"
    }`}
    title={label}
  >
    <option value="">{label}</option>
    {options.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
);

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  onChange,
  provinces,
  districts,
  genders,
  years,
  months,
}) => {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const set = (key: keyof IDashboardFilters) => (value: string) => {
    if (key === "province") {
      onChange({ ...filters, province: value, district: "" });
    } else {
      onChange({ ...filters, [key]: value });
    }
  };
  const reset = () => onChange(EMPTY);

  return (
    <div className="bg-white border border-gray-100 rounded-lg px-2.5 py-1.5 shadow-sm">
      {/* Compact horizontal layout */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Filter icon */}
        <div className="flex items-center gap-1 text-xs font-medium text-gray-600 shrink-0">
          <Filter size={12} className="text-[#3363AD]" />
        </div>

        {/* Dropdowns */}
        {provinces.length > 0 && (
          <SelectFilter
            label="Province"
            value={filters.province}
            options={provinces}
            onChange={set("province")}
          />
        )}
        {filters.province !== "" && districts.length > 0 && (
          <SelectFilter
            label="District"
            value={filters.district}
            options={districts}
            onChange={set("district")}
          />
        )}
        {genders.length > 0 && (
          <SelectFilter
            label="Gender"
            value={filters.gender}
            options={genders}
            onChange={set("gender")}
          />
        )}
        <select
          value={filters.role}
          onChange={(e) => set("role")(e.target.value)}
          className={`text-xs border rounded px-1.5 py-0.5 focus:outline-none
            focus:ring-1 focus:ring-[#3363AD] bg-white transition-colors min-w-[70px] ${
            filters.role
              ? "border-[#3363AD] text-[#3363AD] font-medium"
              : "border-gray-200 text-gray-600"
          }`}
          title="CHW Role"
        >
          <option value="">CHW Role</option>
          <option value="TRAINEE">CHW</option>
          <option value="TESTER">Tester</option>
        </select>
        {years.length > 0 && (
          <SelectFilter
            label="Year"
            value={filters.year}
            options={years}
            onChange={set("year")}
          />
        )}
        {months.length > 0 && (
          <SelectFilter
            label="Month"
            value={filters.month}
            options={months}
            onChange={set("month")}
          />
        )}
        
        {/* Clear button */}
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-0.5 text-xs text-gray-400
              hover:text-red-500 transition-colors px-1.5 py-0.5 rounded
              hover:bg-red-50"
            title="Clear all filters"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Active filter count badge - compact version */}
      {hasActiveFilters && (
        <div className="mt-1 pt-1 border-t border-gray-50">
          <div className="flex items-center gap-1 flex-wrap">
            {Object.entries(filters)
              .filter(([, v]) => v !== "")
              .map(([key, value]) => (
                <span
                  key={key}
                  className="flex items-center gap-0.5 bg-[#3363AD]/10 text-[#3363AD]
                    text-[10px] px-1.5 py-0.5 rounded-full"
                >
                  {key === "role" ? (ROLE_LABELS[value] ?? value) : value}
                  <button
                    onClick={() => set(key as keyof IDashboardFilters)("")}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={8} />
                  </button>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
