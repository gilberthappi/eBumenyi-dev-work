import React from "react";
import { Card } from "@/components/common/Card";
import { IRecentStudentActivity } from "@/types";

interface RecentLearnerActivityProps {
  activities: IRecentStudentActivity[];
  isSupervisorView?: boolean;
}

export const RecentLearnerActivity: React.FC<RecentLearnerActivityProps> = ({
  activities,
  isSupervisorView = false,
}) => {
  const getInitials = (name: string): string => {
    const words = name.split(" ");
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    if (status === "Completed" || status === "GRADUATED") {
      return "bg-green-100 text-green-700";
    }
    if (status === "SUSPENDED") {
      return "bg-red-100 text-red-700";
    }
    return "bg-blue-100 text-blue-700";
  };

  const getStatusText = (status: string) => {
    if (status === "Completed" || status === "GRADUATED") return "Completed";
    if (status === "SUSPENDED") return "Suspended";
    return "Active";
  };

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Activity{isSupervisorView && <span className="text-gray-500"> (Your Team)</span>}
        </h3>
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      </Card>
    );
  }

  const displayActivities = activities.slice(0, 8);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Recent Activity{isSupervisorView && <span className="text-gray-500"> (Your Team)</span>}
      </h3>

      <div className="space-y-0">
        {displayActivities.map((activity) => {
          const initials = getInitials(activity.studentName);

          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0"
            >
              {/* Avatar */}
              {activity.studentPhoto ? (
                <img
                  src={activity.studentPhoto}
                  alt={activity.studentName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#3363AD]/10 text-[#3363AD] flex items-center justify-center text-xs font-semibold shrink-0">
                  {initials}
                </div>
              )}

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {activity.studentName}
                </p>
                <p className="text-xs text-gray-500 truncate">{activity.courseName}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-20 bg-gray-100 rounded-full h-1.5 shrink-0">
                <div
                  className="h-1.5 rounded-full bg-[#3363AD] transition-all duration-500"
                  style={{ width: `${activity.progress}%` }}
                />
              </div>

              {/* Progress Percentage */}
              <span className="text-xs font-medium text-gray-600 w-9 text-right shrink-0">
                {activity.progress}%
              </span>

              {/* Status Badge */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${getStatusBadge(activity.status)}`}
              >
                {getStatusText(activity.status)}
              </span>
            </div>
          );
        })}
      </div>

      {activities.length > 8 && (
        <p className="text-xs text-[#3363AD] cursor-pointer hover:underline mt-2 text-right">
          View All →
        </p>
      )}
    </Card>
  );
};
