import { CreateFeedbackDto, GetFeedbackResponse, CreateCoursePerformanceFeedbackDto, GetCoursePerformanceFeedbackResponse } from '@/types';
import httpClient from './httpClient';

export const createFeedback = async (data: CreateFeedbackDto | FormData) => {
  // For simple text feedbacks, send JSON
  if (!(data instanceof FormData) && typeof (data as CreateFeedbackDto).message === 'string') {
    const resp = await httpClient.post('/feedbacks', data as CreateFeedbackDto, { headers: { 'Content-Type': 'application/json' } });
    return (resp as any).data;
  }

  // Fallback: send as form data
  const formData = new FormData();
  formData.append('slideId', (data as any).slideId);
  formData.append('isPublished', (data as any).isPublished ? 'true' : 'false');
  formData.append('message', (data as any).message);
  const response = await httpClient.post('/feedbacks', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return (response as any).data;
};

export const getFeedbackByCourse = async (courseId: string): Promise<GetFeedbackResponse> => {
  const response = await httpClient.get(`/feedbacks/by-course/${courseId}`);
  return (response as any).data as GetFeedbackResponse;
};

export const deleteFeedback = async (id: string) => {
  const response = await httpClient.delete(`/feedbacks/${id}`);
  return (response as any).data;
};

export const createCoursePerformanceFeedback = async (data: CreateCoursePerformanceFeedbackDto) => {
  const response = await httpClient.post('/course-performance-feedbacks', data, { headers: { 'Content-Type': 'application/json' } });
  return (response as any).data;
};

export const getCoursePerformanceFeedback = async (courseId: string, performanceType?: 'pass' | 'fail'): Promise<GetCoursePerformanceFeedbackResponse> => {
  const params = performanceType ? `?performanceType=${performanceType}` : '';
  const response = await httpClient.get(`/course-performance-feedbacks/${courseId}${params}`);
  return (response as any).data as GetCoursePerformanceFeedbackResponse;
};

export const deleteCoursePerformanceFeedback = async (id: string) => {
  const response = await httpClient.delete(`/course-performance-feedbacks/${id}`);
  return (response as any).data;
};
