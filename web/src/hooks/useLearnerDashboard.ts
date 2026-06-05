import { useState, useEffect, useCallback } from "react";
import { getMyCertificates, IMyCertificate } from "@/services/certificates.service";
import { getStudentStatistics, IStudentStatistics } from "@/services/progress.service";

interface LearnerDashboardData {
  studentStats: IStudentStatistics | null;
  certificates: IMyCertificate[];
  totalCertificates: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useLearnerDashboard = (): LearnerDashboardData => {
  const [studentStats, setStudentStats] = useState<IStudentStatistics | null>(null);
  const [certificates, setCertificates] = useState<IMyCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [stats, certs] = await Promise.all([
        getStudentStatistics(),
        getMyCertificates(),
      ]);
      setStudentStats(stats);
      setCertificates(certs);
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    studentStats,
    certificates,
    totalCertificates: certificates.length,
    isLoading,
    error,
    refetch: fetchAll,
  };
};
