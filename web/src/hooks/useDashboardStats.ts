import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import {
  IDashboardStats,
  ICourseAnalytics,
  IStudentAnalytics,
  IDashboardFilters,
} from "@/types";

interface DashboardData {
  dashboardStats: IDashboardStats | null;
  courseAnalytics: ICourseAnalytics | null;
  studentAnalytics: IStudentAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboardStats = ({
  enabled,
  filters,
}: {
  enabled: boolean;
  filters?: IDashboardFilters;
}): DashboardData => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<IDashboardStats | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<ICourseAnalytics | null>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<IStudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRoles = user?.roles
    ? Array.isArray(user.roles) ? user.roles : [user.roles]
    : [];

  const isContentManager =
    userRoles.some(r => ["ADMIN", "TRAINER", "STAFF"].includes(r));

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const qsParams = new URLSearchParams();
    if (filters?.district) qsParams.append("district", filters.district);
    if (filters?.province) qsParams.append("province", filters.province);
    if (filters?.gender)   qsParams.append("gender",   filters.gender);
    if (filters?.role)     qsParams.append("role",     filters.role);
    if (filters?.year)     qsParams.append("year",     filters.year);
    if (filters?.month)    qsParams.append("month",    filters.month);
    const qs = qsParams.toString() ? `?${qsParams.toString()}` : "";

    try {
      const [dashRes, courseRes, studentRes] = await Promise.allSettled([
        api.get(`/courses/dashboard/statistics${qs}`),
        isContentManager ? api.get(`/export/dashboard/course/analytics${qs}`) : Promise.resolve(null),
        isContentManager ? api.get(`/export/dashboard/student/analytics${qs}`) : Promise.resolve(null),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data?.data) {
        setDashboardStats(dashRes.value.data.data);
      }

      if (courseRes.status === "fulfilled" && courseRes.value?.data?.data) {
        setCourseAnalytics(courseRes.value.data.data);
      }

      if (studentRes.status === "fulfilled" && studentRes.value?.data?.data) {
        setStudentAnalytics(studentRes.value.data.data);
      }
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isContentManager, filters?.district, filters?.province, filters?.gender, filters?.role, filters?.year, filters?.month]);

  useEffect(() => {
    if (enabled) fetchAll();
  }, [fetchAll, enabled]);

  return { dashboardStats, courseAnalytics, studentAnalytics, isLoading, error, refetch: fetchAll };
};
