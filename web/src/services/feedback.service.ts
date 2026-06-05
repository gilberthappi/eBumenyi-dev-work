import { IChapterReview, ICourseReview, IPaged, ISectionReview, ISlideFeedback, ISystemReview } from "@/types";
import api from "./api";

// API Functions
export const getSlideFeedbacks = async (params?: string): Promise<IPaged<ISlideFeedback[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/feedbacks${queryParams}`)).data;
};

export const getChapterReviews = async (params?: string): Promise<IPaged<IChapterReview[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/chapter-reviews${queryParams}`)).data;
};

export const getSectionReviews = async (params?: string): Promise<IPaged<ISectionReview[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/section-reviews${queryParams}`)).data;
};

export const getCourseReviews = async (params?: string): Promise<IPaged<ICourseReview[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/course-reviews${queryParams}`)).data;
};

export const getSystemReviews = async (params?: string): Promise<IPaged<ISystemReview[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/system-reviews${queryParams}`)).data;
};

export const exportReviews = async (params?: string): Promise<Blob> => {
  const queryParams = params ? params : "";
  const response = await api.get(`/export/reviews${queryParams}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const getReviewsSummary = async (): Promise<{
  success: boolean;
  data: {
    summary: {
      feedbacks: number;
      systemReviews: number;
      courseReviews: number;
      sectionReviews: number;
      chapterReviews: number;
    };
    totalRecords: number;
  };
}> => {
  return (await api.get('/export/summary?exportAll=true')).data;
};
