import api from "./api";

export interface NotificationCategories {
  courseUpdates: boolean;
  assignmentReminders: boolean;
  certificates: boolean;
  systemUpdates: boolean;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  emailNotif: boolean;
  pushNotif: boolean;
  smsNotif: boolean;
  categories: NotificationCategories;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  theme?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  emailNotif?: boolean;
  pushNotif?: boolean;
  smsNotif?: boolean;
  categories?: NotificationCategories;
}

export async function getSettings(): Promise<UserSettings> {
  const res = await api.get<{ data: UserSettings }>("/settings");
  return res.data.data;
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<UserSettings> {
  const res = await api.put<{ data: UserSettings }>("/settings", payload);
  return res.data.data;
}
