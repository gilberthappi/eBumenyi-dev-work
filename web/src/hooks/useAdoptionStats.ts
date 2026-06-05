import { useState, useEffect, useCallback } from "react";
import {
  IHospital,
  IEnrollmentTrend,
  ITestScoreAnalytics,
  ICommunicationsAnalytics,
  IDemographicsAnalytics,
  ICHWStats,
  ICourseAnalytics,
  ICourseDurationStats,
  IRecentActivityFeed,
} from "@/types";
import api from "@/services/api";
import {
  getTestScoreAnalytics,
  getCommunicationsAnalytics,
  getDemographicsAnalytics,
  getCHWDashboardStats,
  getCourseDurationStats,
  getRecentActivityFeed,
} from "@/services/analytics.service";

export interface AnalyticsFilters {
  district?: string;
  province?: string;
  gender?: string;
  role?: string;
  year?: string;
  month?: string;
}

interface AdoptionStats {
  hospitals: IHospital[];
  totalChws: number;
  activeChws: number;
  registrationRate: number;
  activeRate: number;
  enrollmentTrends: IEnrollmentTrend[];
  avgStudyTime: number; // minutes, from studentAnalytics
  byProvince: {
    province: string;
    totalChws: number;
    activeChws: number;
    hospitals: number;
  }[];
  courseAnalytics: ICourseAnalytics | null;
  testScores: ITestScoreAnalytics | null;
  communications: ICommunicationsAnalytics | null;
  demographics: IDemographicsAnalytics | null;
  chwStats: ICHWStats | null;
  courseDuration: ICourseDurationStats | null;
  recentActivity: IRecentActivityFeed | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const TOTAL_CHWS_NATIONAL = 58567;

export const useAdoptionStats = (filters: AnalyticsFilters = {}): AdoptionStats => {
  const [hospitals, setHospitals] = useState<IHospital[]>([]);
  const [enrollmentTrends, setEnrollmentTrends] = useState<IEnrollmentTrend[]>([]);
  const [avgStudyTime, setAvgStudyTime] = useState(0);
  const [courseAnalytics, setCourseAnalytics] = useState<ICourseAnalytics | null>(
    null,
  );
  const [testScores, setTestScores] = useState<ITestScoreAnalytics | null>(null);
  const [communications, setCommunications] =
    useState<ICommunicationsAnalytics | null>(null);
  const [demographics, setDemographics] = useState<IDemographicsAnalytics | null>(
    null,
  );
  const [chwStats, setChwStats] = useState<ICHWStats | null>(null);
  const [courseDuration, setCourseDuration] = useState<ICourseDurationStats | null>(
    null,
  );
  const [recentActivity, setRecentActivity] = useState<IRecentActivityFeed | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build query string
      const qsParams = new URLSearchParams();
      if (filters.district) qsParams.append("district", filters.district);
      if (filters.province) qsParams.append("province", filters.province);
      if (filters.gender) qsParams.append("gender", filters.gender);
      if (filters.role) qsParams.append("role", filters.role);
      if (filters.year) qsParams.append("year", filters.year);
      if (filters.month) qsParams.append("month", filters.month);
      
      const qs = qsParams.toString();
      const qsPrefix = qs ? `?${qs}` : "";

      const results = await Promise.allSettled([
        api.get("/hospitals/"), // We can append it to hospitals if hospitals endpoint supports it, but probably it doesn't. Leaving as is.
        api.get(`/export/dashboard/course/analytics${qsPrefix}`),
        api.get(`/export/dashboard/student/analytics${qsPrefix}`),
        getTestScoreAnalytics(qs),
        getCommunicationsAnalytics(qs),
        getDemographicsAnalytics(qs),
        getCHWDashboardStats(qs),
        getCourseDurationStats(qs),
        getRecentActivityFeed(qs),
      ]);

      let hospitalList: IHospital[] = [];
      const hospitalsRes = results[0];
      if (hospitalsRes.status === "fulfilled") {
        const raw = hospitalsRes.value?.data;
        hospitalList = raw?.data ?? raw ?? [];
        setHospitals(hospitalList);
      }

      const analyticsRes = results[1];
      if (analyticsRes.status === "fulfilled") {
        const d = analyticsRes.value?.data?.data;
        setCourseAnalytics(d ?? null);
        setEnrollmentTrends(d?.enrollmentTrends ?? []);
      }

      const studentRes = results[2];
      if (studentRes.status === "fulfilled") {
        const d = studentRes.value?.data?.data;
        setAvgStudyTime(d?.avgStudyTime ?? 0);
      }

      const testRes = results[3];
      if (testRes.status === "fulfilled") {
        setTestScores(testRes.value?.data ?? null);
      }

      const commRes = results[4];
      if (commRes.status === "fulfilled") {
        setCommunications(commRes.value?.data ?? null);
      }

      const demoRes = results[5];
      if (demoRes.status === "fulfilled") {
        setDemographics(demoRes.value?.data ?? null);
      }

      const chwRes = results[6]; // 7th item (index 6)
      if (chwRes.status === "fulfilled") {
        setChwStats(chwRes.value?.data ?? null);
      }

      const durationRes = results[7]; // 8th item (index 7)
      if (durationRes.status === "fulfilled") {
        setCourseDuration(durationRes.value?.data ?? null);
      }

      const activityRes = results[8]; // 9th item (index 8)
      if (activityRes.status === "fulfilled") {
        setRecentActivity(activityRes.value?.data ?? null);
      }
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.district,
    filters.province,
    filters.gender,
    filters.role,
    filters.year,
    filters.month,
  ]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalChws = hospitals.reduce((s, h) => s + (h.totalChws ?? 0), 0);
  const activeChws = hospitals.reduce((s, h) => s + (h.activeChws ?? 0), 0);
  const registrationRate = Math.round((totalChws / TOTAL_CHWS_NATIONAL) * 100);
  const activeRate = totalChws > 0 ? Math.round((activeChws / totalChws) * 100) : 0;

  const provinceMap = new Map<
    string,
    { totalChws: number; activeChws: number; hospitals: number }
  >();
  for (const h of hospitals) {
    const prov = h.province ?? "Unknown";
    const ex = provinceMap.get(prov) ?? {
      totalChws: 0,
      activeChws: 0,
      hospitals: 0,
    };
    provinceMap.set(prov, {
      totalChws: ex.totalChws + (h.totalChws ?? 0),
      activeChws: ex.activeChws + (h.activeChws ?? 0),
      hospitals: ex.hospitals + 1,
    });
  }

  const byProvince = Array.from(provinceMap.entries())
    .map(([province, data]) => ({ province, ...data }))
    .sort((a, b) => b.totalChws - a.totalChws);

  return {
    hospitals,
    totalChws,
    activeChws,
    registrationRate,
    activeRate,
    enrollmentTrends,
    avgStudyTime,
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
    refetch: fetchAll,
  };
};
