import React from "react";

interface SectionSkeletonProps {
  rows?: number;   // number of chart-height skeleton rows, default 2
  cards?: number;  // number of KPI card skeletons, default 4
}

export const SectionSkeleton: React.FC<SectionSkeletonProps> = ({
  rows = 2,
  cards = 4,
}) => (
  <div className="space-y-5 animate-pulse">
    <div className="h-5 w-48 bg-gray-100 rounded-lg" />
    <div className={`grid grid-cols-2 lg:grid-cols-${cards} gap-4`}>
      {[...Array(cards)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-xl" />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 bg-gray-100 rounded-xl" />
        <div className="h-56 bg-gray-100 rounded-xl" />
      </div>
    ))}
  </div>
);
