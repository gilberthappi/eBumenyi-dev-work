import React from "react";
import { Card } from "@/components/common/Card";
import { ICourseAnalytics } from "@/types";
import { Award, TrendingUp, TrendingDown } from "lucide-react";

interface CertificationCardProps {
  courseAnalytics: ICourseAnalytics | null;
}

export const CertificationCard: React.FC<CertificationCardProps> = ({ courseAnalytics }) => {
  if (!courseAnalytics) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-[#3363AD]" />
          <h3 className="text-lg font-semibold text-gray-800">Certificates</h3>
        </div>
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      </Card>
    );
  }

  const { certificatesIssued, avgCompletionRate, topPerformingCourses } = courseAnalytics;

  const getCompletionColor = (value: number) => {
    if (value >= 60) return "text-green-600";
    if (value >= 30) return "text-amber-500";
    return "text-red-500";
  };

  const renderTrend = (trend: { value: number; direction: "up" | "down" | "stable" }) => {
    if (trend.direction === "up") {
      return (
        <div className="flex items-center gap-1 text-xs">
          <TrendingUp size={14} className="text-green-500" />
          <span className="text-green-600">+{trend.value}%</span>
        </div>
      );
    }
    if (trend.direction === "down") {
      return (
        <div className="flex items-center gap-1 text-xs">
          <TrendingDown size={14} className="text-red-500" />
          <span className="text-red-500">-{trend.value}%</span>
        </div>
      );
    }
    return <span className="text-gray-400 text-xs">—</span>;
  };

  const topCourses = topPerformingCourses ? topPerformingCourses.slice(0, 3) : [];

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Award size={20} className="text-[#3363AD]" />
        <h3 className="text-lg font-semibold text-gray-800">Certificates</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-3xl font-bold text-[#3363AD]">{certificatesIssued.value}</p>
          <p className="text-sm text-gray-600 mb-1">Issued</p>
          {renderTrend(certificatesIssued.trend)}
        </div>
        <div>
          <p className={`text-3xl font-bold ${getCompletionColor(avgCompletionRate.value)}`}>
            {avgCompletionRate.value}%
          </p>
          <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
          {renderTrend(avgCompletionRate.trend)}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Top Performing Courses</p>
        <div className="space-y-3">
          {topCourses.map((course) => {
            const truncatedName = course.name.length > 20
              ? course.name.substring(0, 20) + "..."
              : course.name;

            return (
              <div key={course.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700" title={course.name}>
                    {truncatedName}
                  </span>
                  <span className="text-xs text-gray-500">{course.rate}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#3363AD] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${course.rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
