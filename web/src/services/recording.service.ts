import api from "./api";
import { getBackendURL } from "@/config/api.config";

export type RecordingAudience = "ALL" | "TRAINEES" | "INVITED";

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
  photo: string;
}

export const buildRecordingUrl = (url: string): string => {
  if (url.startsWith("http")) return url;
  return `${getBackendURL()}${url}`;
};

export const getAllRecordings = async (): Promise<{ data: IMeetingRecording[] }> => {
  return (await api.get("/recordings/")).data;
};

export const getPublishedRecordings = async (): Promise<{ data: IMeetingRecording[] }> => {
  return (await api.get("/recordings/published")).data;
};

export const publishRecording = async (
  id: string,
  publishedTo: RecordingAudience,
  invitedUserIds?: string[],
): Promise<{ data: IMeetingRecording }> => {
  return (
    await api.patch(`/recordings/${id}/publish`, { publishedTo, invitedUserIds })
  ).data;
};

export const unpublishRecording = async (id: string): Promise<{ data: IMeetingRecording }> => {
  return (await api.patch(`/recordings/${id}/unpublish`)).data;
};

export const deleteRecording = async (id: string): Promise<void> => {
  await api.delete(`/recordings/${id}`);
};

export const getTrainees = async (search?: string): Promise<ITraineeOption[]> => {
  const params = search ? { searchq: search } : {};
  const res = await api.get("/auth/users/all", { params });
  const all: (ITraineeOption & { userRoles?: { role: string }[] })[] =
    res.data?.data ?? res.data ?? [];
  return all.filter((u) =>
    u.userRoles?.some((r) => r.role === "TRAINEE"),
  );
};
