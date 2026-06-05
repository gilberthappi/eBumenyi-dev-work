import React from "react";
import { BookOpen, CheckCircle, Award, TrendingUp } from "lucide-react";
import { IStudentStatistics } from "@/services/progress.service";

interface LearnerStatsRowProps {
  summary: IStudentStatistics["summary"] | null;
  totalCertificates: number;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  sublabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  borderColor,
  sublabel,
}) => (
  <div className={`bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-200 border-t-4 ${borderColor}`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
    <p className="text-xs font-medium text-gray-500 mt-1">{title}</p>
    {sublabel && (
      <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
    )}
  </div>
);

export const LearnerStatsRow: React.FC<LearnerStatsRowProps> = ({
  summary,
  totalCertificates,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const enrolled = summary?.enrolledCourses ?? 0;
  const completed = summary?.completedCourses ?? 0;
  const completionPct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Enrolled"
        value={enrolled}
        icon={<BookOpen size={18} />}
        iconBg="bg-[#EBF0F9]"
        iconColor="text-[#3363AD]"
        borderColor="border-t-[#3363AD]"
        sublabel="Total courses joined"
      />
      <StatCard
        title="Completed"
        value={completed}
        icon={<CheckCircle size={18} />}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        borderColor="border-t-emerald-500"
        sublabel={enrolled > 0 ? `${completed} of ${enrolled} courses` : "No courses yet"}
      />
      <StatCard
        title="Completion Rate"
        value={`${completionPct}%`}
        icon={<TrendingUp size={18} />}
        iconBg="bg-blue-50"
        iconColor="text-blue-500"
        borderColor="border-t-blue-400"
        sublabel={completionPct === 100 ? "All done!" : completionPct > 0 ? "Keep going!" : "Start a course"}
      />
      <StatCard
        title="Certificates"
        value={totalCertificates}
        icon={<Award size={18} />}
        iconBg="bg-amber-50"
        iconColor="text-amber-500"
        borderColor="border-t-amber-400"
        sublabel={totalCertificates > 0 ? "Earned so far" : "Complete a course"}
      />
    </div>
  );
};
