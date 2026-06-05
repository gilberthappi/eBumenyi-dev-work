import React, { useState } from "react";
import { Phase3Section } from "@/components/dashboard/Phase3Section";
import { LearnerSection } from "@/components/dashboard/LearnerSection";
import { AdoptionSection } from "@/components/dashboard/AdoptionSection";
import { DeveloperSection } from "@/components/dashboard/DeveloperSection";
import { CHOSection } from "@/components/dashboard/CHOSection";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { IDashboardFilters } from "@/types";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [filters, setFilters] = useState<IDashboardFilters>({
    province: "",
    district: "",
    gender: "",
    role: "TRAINEE",
    year: "",
    month: "",
  });

  const userRoles: string[] = user?.roles
    ? Array.isArray(user.roles)
      ? (user.roles as string[])
      : [user.roles as string]
    : [];

  const needsAnalytics = userRoles.some((r) =>
    ["ADMIN", "TRAINER", "STAFF", "DEVELOPER"].includes(r),
  );

  const { dashboardStats, courseAnalytics, studentAnalytics, isLoading } =
    useDashboardStats({ enabled: needsAnalytics, filters });

  const is = (role: string) => userRoles.includes(role);
  const isAnyOf = (...roles: string[]) => roles.some((r) => userRoles.includes(r));

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#3363AD]' />
      </div>
    );
  }

  const isLearner = isAnyOf("TRAINEE", "TESTER", "CHO");
  const isCHO = is("CHO");
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const learnerSubtitle =
    hour < 12
      ? "Ready to learn something new today?"
      : hour < 17
        ? "Keep up the great progress!"
        : "A great time to review what you've learned.";

  return (
    <div className='space-y-8 p-1'>
      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold text-gray-900'>
            {isLearner || isCHO
              ? `${greeting}, ${user.fullNames}!`
              : `Welcome, ${user.fullNames}!`}
          </h1>
          <p className='text-xs text-gray-500 mt-0.5'>
            {isLearner ? learnerSubtitle : "Here's what's happening on the platform"}
          </p>
        </div>

        {/* Filters will be injected here by AdoptionSection */}
        <div id='global-filters-container' className='flex-shrink-0' />
      </div>

      {isAnyOf("ADMIN", "STAFF", "DEVELOPER") && (
        <AdoptionSection filters={filters} onFiltersChange={setFilters} />
      )}

      {isAnyOf("ADMIN", "TRAINER", "STAFF", "DEVELOPER") && (
        <Phase3Section
          dashboardStats={dashboardStats}
          courseAnalytics={courseAnalytics}
          studentAnalytics={studentAnalytics}
          isLoading={isLoading}
          isSupervisorView={false}
          hideKpis={isAnyOf("ADMIN", "DEVELOPER")}
          filters={filters}
        />
      )}

      {is("DEVELOPER") && <DeveloperSection />}

      {isAnyOf("TRAINEE", "TESTER", "CHO") && <LearnerSection />}

      {isCHO && <CHOSection />}
    </div>
  );
};
