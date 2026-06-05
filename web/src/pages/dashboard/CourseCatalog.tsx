import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Star, Users, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { getCoursesWithProgress } from "@/services/course.service";
import { enrollInCourse } from "@/services/progress.service";
import { ICourse } from "@/types";

const CourseCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Returns all published courses; each course's progresses[] is filtered
      // to only this student's records, so length > 0 means enrolled.
      const allCourses = await getCoursesWithProgress();
      setCourses(allCourses);
      const ids = new Set(
        allCourses.filter((c) => (c.progresses?.length ?? 0) > 0).map((c) => c.id)
      );
      setEnrolledIds(ids);
    } catch {
      setError("Failed to load courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await enrollInCourse(courseId);
      setEnrolledIds((prev) => new Set(prev).add(courseId));
    } catch {
      // enrollment may fail if already enrolled — refresh to sync
      await loadData();
    } finally {
      setEnrollingId(null);
    }
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3363AD] mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <p className="text-red-500 text-sm">{error}</p>
        <Button size="sm" onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Course Catalog</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse all available training courses and enroll to start learning.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3363AD]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="text-[#3363AD]" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Available</p>
              <p className="text-xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Enrolled</p>
              <p className="text-xl font-bold text-gray-900">{enrolledIds.size}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Not Enrolled</p>
              <p className="text-xl font-bold text-gray-900">{courses.length - enrolledIds.size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]"
        />
      </div>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No courses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const isEnrolled = enrolledIds.has(course.id);
            const isEnrolling = enrollingId === course.id;
            const sectionCount = course.sections?.length ?? 0;

            return (
              <Card key={course.id} padding={false} hover className="flex flex-col">
                {/* Cover */}
                <div className="relative h-40 bg-gradient-to-br from-[#3363AD] to-[#1a3d7c] rounded-t-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {course.intro?.bannerImage ? (
                    <img
                      src={course.intro.bannerImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : course.coverIcon ? (
                    <img
                      src={course.coverIcon}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <BookOpen className="text-white opacity-60" size={40} />
                  )}
                  {isEnrolled && (
                    <Badge
                      variant="success"
                      size="sm"
                      className="absolute top-2 right-2"
                    >
                      Enrolled
                    </Badge>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                      {course.title}
                    </h3>
                    {course.intro?.summary || course.description ? (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {course.intro?.summary ?? course.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {course.rating != null && (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        {Number(course.rating).toFixed(1)}
                      </span>
                    )}
                    {sectionCount > 0 && (
                      <span>{sectionCount} section{sectionCount !== 1 ? "s" : ""}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    {isEnrolled ? (
                      <Button
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1"
                        onClick={() => navigate(`/learn/${course.id}`)}
                      >
                        Continue
                        <ChevronRight size={14} />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1"
                        onClick={() => handleEnroll(course.id)}
                        disabled={isEnrolling}
                      >
                        {isEnrolling ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : null}
                        {isEnrolling ? "Enrolling..." : "Enroll Now"}
                      </Button>
                    )}
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

export default CourseCatalog;
