import React from "react";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/common/Card";
import { EnrolledCourse } from "@/types";

interface MyCoursesListProps {
  courses: EnrolledCourse[];
  isLoading: boolean;
}

export const MyCoursesList: React.FC<MyCoursesListProps> = ({
  courses,
  isLoading,
}) => {
  const visible = courses.slice(0, 6);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[#3363AD]" />
          <h3 className="text-sm font-semibold text-gray-800">
            My Courses
          </h3>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
          {courses.length} courses
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <BookOpen size={32} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No courses enrolled</p>
        </div>
      ) : (
        <div>
          {visible.map((course) => (
            <div
              key={course.courseId}
              className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
            >
              <div className="w-10 h-10 rounded-lg bg-[#3363AD]/10 flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-[#3363AD]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {course.courseTitle}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        course.isCompleted ? "bg-green-500" : "bg-[#3363AD]"
                      }`}
                      style={{
                        width: `${parseFloat(course.progress ?? "0")}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 w-8 text-right">
                    {parseFloat(course.progress ?? "0").toFixed(0)}%
                  </span>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  course.isCompleted
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {course.isCompleted ? "Completed" : "Active"}
              </span>
            </div>
          ))}
          {courses.length > 6 && (
            <p className="text-xs text-[#3363AD] cursor-pointer hover:underline mt-3 text-right">
              View all →
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
