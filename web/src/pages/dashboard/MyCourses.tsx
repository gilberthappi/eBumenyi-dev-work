import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  PlayCircle,
  ClipboardList,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import {
  getStudentStatistics,
  IStudentStatistics,
  ICourseStatEntry,
} from "@/services/progress.service";

export const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<IStudentStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStats(await getStudentStatistics());
    } catch {
      setError("Failed to load your courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#3363AD] mx-auto" size={32} />
          <p className="mt-3 text-sm text-gray-500">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <p className="text-red-500 text-sm">{error}</p>
        <Button size="sm" onClick={loadStats}>Retry</Button>
      </div>
    );
  }

  const summary = stats?.summary;
  const enrolledCourses = (stats?.courses ?? []).filter((c) => c.isEnrolled);
  const lastViewed = stats?.lastViewedLocation ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Learning</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your enrolled courses and continue where you left off.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/course-catalog")}
          className="flex items-center gap-1"
        >
          <BookOpen size={14} />
          Browse Catalog
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3363AD]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="text-[#3363AD]" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Enrolled</p>
              <p className="text-xl font-bold text-gray-900">{summary?.enrolledCourses ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-xl font-bold text-gray-900">{summary?.completedCourses ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="text-orange-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">In Progress</p>
              <p className="text-xl font-bold text-gray-900">{summary?.startedCourses ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="text-purple-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Available</p>
              <p className="text-xl font-bold text-gray-900">{summary?.totalCourses ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Continue where you left off */}
      {lastViewed && (
        <div
          className="flex items-center gap-4 bg-[#3363AD] text-white rounded-xl p-4 cursor-pointer hover:bg-[#2a52a0] transition-colors"
          onClick={() => navigate(`/learn/${lastViewed.courseId}`)}
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <PlayCircle size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/70 font-medium">Continue where you left off</p>
            <p className="text-sm font-semibold truncate">{lastViewed.courseTitle}</p>
            <p className="text-xs text-white/60 truncate">{lastViewed.chapterTitle}</p>
          </div>
          <ArrowRight size={18} className="flex-shrink-0 text-white/70" />
        </div>
      )}

      {/* Course list */}
      {enrolledCourses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <PlayCircle size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No courses yet</p>
          <p className="text-xs mt-1">
            Head to the{" "}
            <button
              onClick={() => navigate("/course-catalog")}
              className="text-[#3363AD] underline"
            >
              Course Catalog
            </button>{" "}
            to enroll in your first course.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrolledCourses.map((course: ICourseStatEntry) => {
            const pct = Math.round(course.progress ?? 0);
            const isDone = course.isCompleted;

            return (
              <Card key={course.courseId} padding={false} hover className="flex flex-col">
                {/* Cover */}
                <div className="relative h-36 bg-gradient-to-br from-[#3363AD] to-[#1a3d7c] rounded-t-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {course.coverIcon ? (
                    <img
                      src={course.coverIcon}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <BookOpen className="text-white opacity-60" size={40} />
                  )}
                  <Badge
                    variant={isDone ? "success" : course.isStarted ? "warning" : "default"}
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    {isDone ? "Completed" : course.isStarted ? "In Progress" : "Not Started"}
                  </Badge>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    {course.totalChapters > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} />
                        {course.totalChapters} chapter{course.totalChapters !== 1 ? "s" : ""}
                      </span>
                    )}
                    {course.totalTests > 0 && (
                      <span className="flex items-center gap-1">
                        <ClipboardList size={11} />
                        {course.completedTests}/{course.totalTests} tests
                      </span>
                    )}
                    {course.courseDuration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {course.courseDuration.toFixed(1)}h
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span className={isDone ? "text-green-600 font-medium" : ""}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isDone ? "bg-green-500" : "bg-[#3363AD]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-auto">
                    <Button
                      size="sm"
                      className="w-full flex items-center justify-center gap-1"
                      onClick={() => navigate(`/learn/${course.courseId}`)}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 size={14} />
                          Review Course
                        </>
                      ) : (
                        <>
                          <PlayCircle size={14} />
                          {course.isStarted ? "Continue Learning" : "Start Course"}
                          <ChevronRight size={14} />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
