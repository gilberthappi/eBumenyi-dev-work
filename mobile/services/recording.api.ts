import httpClient from './httpClient';
import { ASSETS_BASE_URL } from '@/config/constants';

export type RecordingAudience = 'ALL' | 'TRAINEES' | 'INVITED';

export interface IRecordingEvent {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
}

export interface IRecordingUser {
  id: string;
  fullNames: string;
  email: string;
  photo: string;
}

export interface IMeetingRecording {
  id: string;
  eventId: string | null;
  userId: string;
  url: string;
  title: string | null;
  isPublished: boolean;
  publishedTo: RecordingAudience;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  event?: IRecordingEvent | null;
  user?: IRecordingUser;
}

export interface ITraineeOption {
  id: string;
  fullNames: string;
  email: string | null;
  photo: string | null;
}

export interface ApiResponse<T> {
  message: string;
  statusCode: number;
  data: T;
}

export const buildRecordingUrl = (url: string): string => {
  if (url.startsWith('http')) return url;
  return `${ASSETS_BASE_URL}${url}`;
};

export const getAllRecordings = async (): Promise<IMeetingRecording[]> => {
  const res = await httpClient.get<ApiResponse<IMeetingRecording[]>>('/recordings/');
  return res.data?.data ?? [];
};

export const getPublishedRecordings = async (): Promise<IMeetingRecording[]> => {
  const res = await httpClient.get<ApiResponse<IMeetingRecording[]>>('/recordings/published');
  return res.data?.data ?? [];
};

export const publishRecording = async (
  id: string,
  publishedTo: RecordingAudience,
  invitedUserIds?: string[],
): Promise<IMeetingRecording> => {
  const res = await httpClient.patch<ApiResponse<IMeetingRecording>>(`/recordings/${id}/publish`, 
    { publishedTo, invitedUserIds }
  );
  return res.data?.data;
};

export const unpublishRecording = async (id: string): Promise<IMeetingRecording> => {
  const res = await httpClient.patch<ApiResponse<IMeetingRecording>>(`/recordings/${id}/unpublish`);
  return res.data?.data;
};

export const getTrainees = async (search?: string): Promise<ITraineeOption[]> => {
  const params = search ? { searchq: search } : {};
  const res = await httpClient.get<ApiResponse<(ITraineeOption & { userRoles?: { role: string }[] })[]>>('/auth/users/all', { params });
  const all = res.data?.data ?? [];
  return all.filter((u) => u.userRoles?.some((r) => r.role === 'TRAINEE'));
};

export const deleteRecording = async (id: string): Promise<void> => {
  await httpClient.delete(`/recordings/${id}`);
};
