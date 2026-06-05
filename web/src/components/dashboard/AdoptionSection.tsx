import React, { useCallback } from "react";
import { createPortal } from "react-dom";
import { IDashboardFilters } from "@/types";
import { useAdoptionStats } from "@/hooks/useAdoptionStats";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { GlobalFilterBar } from "./GlobalFilterBar";
import { SectionSkeleton } from "./shared/SectionSkeleton";
import { EnrollmentTrendChart } from "./EnrollmentTrendChart";
import { CommunicationsCard } from "./CommunicationsCard";
import { TestScoreAnalyticsCard } from "./TestScoreAnalyticsCard";
import { CourseChartsCard } from "./CourseChartsCard";
import { RecentActivityCard } from "./RecentActivityCard";
import { CourseEngagementTable } from "./CourseEngagementTable";
import { AssessmentOverviewCard } from "./AssessmentOverviewCard";
import { DemographicsSection } from "./DemographicsSection";
import { RwandaDistrictMap } from "./RwandaDistrictMap";
import { CHWStatsCards } from "./CHWStatsCards";

interface AdoptionSectionProps {
  filters: IDashboardFilters;
  onFiltersChange: (f: IDashboardFilters) => void;
}

export const AdoptionSection: React.FC<AdoptionSectionProps> = ({
  filters,
  onFiltersChange,
}) => {

  const {
    hospitals,
    enrollmentTrends,
    byProvince,
    courseAnalytics,
    testScores,
    communications,
    demographics,
    chwStats,
    courseDuration,
    recentActivity,
    isLoading,
    error,
  } = useAdoptionStats(filters);

  const {
    availableProvinces,
    availableDistricts,
    availableGenders,
    availableYears,
    availableMonths,
    filteredByDistrict,
    filteredByGender,
    filteredEnrollmentTrends,
    filteredCommTrend,
  } = useDashboardFilters(
    {
      byProvince,
      demographics,
      enrollmentTrends,
      communications,
    },
    filters,
    onFiltersChange
  );

  const handleDistrictClick = useCallback(
    (district: string) => onFiltersChange({ ...filters, district }),
    [filters, onFiltersChange],
  );

  // Portal the filters to the top-level header
  const filterPortal = typeof document !== 'undefined' 
    ? document.getElementById('global-filters-container')
    : null;

  if (isLoading && !chwStats) return <SectionSkeleton cards={5} rows={2} />;

  return (
    <>
      {/* Render filters in the top header via portal */}
      {filterPortal && createPortal(
        <GlobalFilterBar
          filters={filters}
          onChange={onFiltersChange}
          provinces={availableProvinces}
          districts={availableDistricts}
          genders={availableGenders}
          years={availableYears}
          months={availableMonths}
        />,
        filterPortal
      )}

      <div className={`space-y-5 transition-opacity duration-200 ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        {error && (
          <div
            className='text-sm text-red-500 bg-red-50 border border-red-100
            rounded-lg px-4 py-3'
          >
            {error}
          </div>
        )}

        {(filters.district || filters.province || filters.gender || filters.role || filters.year || filters.month) && (
          <div className="bg-blue-50/50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Showing filtered analytics. Clear filters in the top bar to view all data.
          </div>
        )}

      {/* KPI row */}
      <CHWStatsCards data={chwStats} isLoading={isLoading} />

      {/* Course engagement table + Assessment overview */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <CourseEngagementTable
          courseAnalytics={courseAnalytics}
          testScores={testScores}
        />
        <AssessmentOverviewCard chwStats={chwStats} testScores={testScores} />
      </div>

      {/* District map */}
      <RwandaDistrictMap
        byDistrict={demographics?.byDistrict ?? []}
        hospitals={hospitals}
        activeDistrict={filters.district}
        onDistrictClick={handleDistrictClick}
      />

      {/* Communications (filtered trend) + Test scores */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <CommunicationsCard
          data={communications}
          filteredTrend={filteredCommTrend}
        />
        <TestScoreAnalyticsCard data={testScores} />
      </div>

      {/* Demographics (filtered by district and gender) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemographicsSection
          data={demographics}
          filteredByDistrict={filteredByDistrict}
          filteredByGender={filteredByGender}
        />
        <EnrollmentTrendChart trends={filteredEnrollmentTrends} />
      </div>

            {/* Course Charts + Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <CourseChartsCard
          courseAnalytics={courseAnalytics}
          testScores={testScores}
          courseDuration={courseDuration}
        />
        <RecentActivityCard data={recentActivity} isLoading={isLoading} />
      </div>

    </div>
    </>
  );
};
