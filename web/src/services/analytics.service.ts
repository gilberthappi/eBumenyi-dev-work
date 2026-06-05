/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IAnalytics,
  IResponse,
  IDashboardStatsResponse,
  ICourseAnalyticsResponse,
  IStudentAnalyticsResponse,
  ITestScoreAnalytics,
  ICommunicationsAnalytics,
  IDemographicsAnalytics,
  ICHWStats,
  ICourseDurationStats,
  IRecentActivityFeed,
  IRecommendationInsightsResponse,
} from "@/types";
import api from "./api";

export const getDashboardStats = async (): Promise<IDashboardStatsResponse> => {
  return (await api.get("/courses/dashboard/statistics")).data;
};

export const getRecommendationInsights = async (): Promise<IRecommendationInsightsResponse> => {
  return (await api.get("/courses/dashboard/recommendations-insights")).data;
};

export const getAnalytics = async (
  params?: string,
): Promise<IResponse<IAnalytics>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/analytics${queryParams}`)).data;
};

export const getCourseAnalytics = async (qs: string = ""): Promise<ICourseAnalyticsResponse> => {
  return (await api.get(`export/dashboard/course/analytics${qs ? '?' + qs : ''}`)).data;
};

export const getStudentAnalytics = async (qs: string = ""): Promise<IStudentAnalyticsResponse> => {
  return (await api.get(`/export/dashboard/student/analytics${qs ? '?' + qs : ''}`)).data;
};

export const getTrainerAnalytics = async (
  trainerId: string,
): Promise<IResponse<any>> => {
  return (await api.get(`/analytics/trainers/${trainerId}`)).data;
};

export const getTestScoreAnalytics = async (qs: string = ""): Promise<
  IResponse<ITestScoreAnalytics>
> => {
  return (await api.get(`/export/dashboard/test-score/analytics${qs ? '?' + qs : ''}`)).data;
};

export const getCommunicationsAnalytics = async (qs: string = ""): Promise<
  IResponse<ICommunicationsAnalytics>
> => {
  return (await api.get(`/export/dashboard/communications/analytics${qs ? '?' + qs : ''}`)).data;
};

export const getDemographicsAnalytics = async (qs: string = ""): Promise<
  IResponse<IDemographicsAnalytics>
> => {
  return (await api.get(`/export/dashboard/demographics/analytics${qs ? '?' + qs : ''}`)).data;
};

export const getCHWDashboardStats = async (qs: string = ""): Promise<IResponse<ICHWStats>> => {
  return (await api.get(`/export/dashboard/chw-stats${qs ? '?' + qs : ''}`)).data;
};

export const getCourseDurationStats = async (qs: string = ""): Promise<
  IResponse<ICourseDurationStats>
> => {
  return (await api.get(`/export/dashboard/course-duration${qs ? '?' + qs : ''}`)).data;
};

export const getRecentActivityFeed = async (qs: string = ""): Promise<
  IResponse<IRecentActivityFeed>
> => {
  return (await api.get(`/export/dashboard/recent-activity${qs ? '?' + qs : ''}`)).data;
};
