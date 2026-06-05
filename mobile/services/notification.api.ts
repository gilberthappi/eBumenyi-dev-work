import { INotification, INotificationResponse } from '@/types';
import httpClient from './httpClient';

export const getNotifications = async (): Promise<INotification[]> => {
  const response = await httpClient.get<INotificationResponse>('/calendar/notifications');
  return response.data?.data || [];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await httpClient.patch(`/calendar/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await httpClient.patch('/calendar/notifications/read-all');
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await httpClient.delete(`/calendar/notifications/${notificationId}`);
};