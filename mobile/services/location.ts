import { IStudentStatisticsResponse } from '@/types';
import httpClient from './httpClient';

export function getLastViewedSlidePath(
  courseStatsData: IStudentStatisticsResponse | undefined,
  courseId: string,
): string {
  const loc = courseStatsData?.data?.lastViewedLocation;
  if (loc && loc.courseId === courseId && loc.sectionId && loc.chapterId) {
    if (loc.slideId) {
      return `/courses/${courseId}/${loc.chapterId}/course-content?slideId=${loc.slideId}`;
    }
    return `/courses/${courseId}/${loc.chapterId}/course-content?page=1`;
  }
  return `/courses/${courseId}/chapters`;
}

export const getAllHospitals = async (params?: {
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}): Promise<any> => {
  const response = await httpClient.get('/hospitals/public', { params });
  return (response as any).data as any;
};
