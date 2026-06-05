import { Prisma } from "@prisma/client";
import { prisma } from "../utils/db";
import { UpdateSettingsDto, UserSettingsResponse, NotificationCategories } from "../utils/interfaces/common";

const DEFAULT_CATEGORIES: NotificationCategories = {
  courseUpdates: true,
  assignmentReminders: true,
  certificates: true,
  systemUpdates: false,
};

export class SettingsService {
  static async getSettings(userId: string): Promise<UserSettingsResponse> {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    return {
      ...settings,
      categories: (settings.categories as unknown as NotificationCategories) ?? DEFAULT_CATEGORIES,
    };
  }

  static async updateSettings(userId: string, data: UpdateSettingsDto): Promise<UserSettingsResponse> {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...(data.theme !== undefined && { theme: data.theme }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.dateFormat !== undefined && { dateFormat: data.dateFormat }),
        ...(data.emailNotif !== undefined && { emailNotif: data.emailNotif }),
        ...(data.pushNotif !== undefined && { pushNotif: data.pushNotif }),
        ...(data.smsNotif !== undefined && { smsNotif: data.smsNotif }),
        ...(data.categories !== undefined && { categories: data.categories as unknown as Prisma.InputJsonValue }),
      },
      update: {
        ...(data.theme !== undefined && { theme: data.theme }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.dateFormat !== undefined && { dateFormat: data.dateFormat }),
        ...(data.emailNotif !== undefined && { emailNotif: data.emailNotif }),
        ...(data.pushNotif !== undefined && { pushNotif: data.pushNotif }),
        ...(data.smsNotif !== undefined && { smsNotif: data.smsNotif }),
        ...(data.categories !== undefined && { categories: data.categories as unknown as Prisma.InputJsonValue }),
      },
    });

    return {
      ...settings,
      categories: (settings.categories as unknown as NotificationCategories) ?? DEFAULT_CATEGORIES,
    };
  }
}
