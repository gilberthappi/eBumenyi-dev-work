import { sendEmail } from "../utils/email";

export interface MeetingInvitationData {
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  meetingType: string;
  hostEmail?: string;
  roles?: Record<string, string>;
  participantName?: string;
  participantEmail: string;
  organizerName: string;
  timezone: string;
}

export class CalendarEmailService {
  static async sendMeetingInvitation(
    data: MeetingInvitationData,
  ): Promise<void> {
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      hostEmail,
      roles,
      participantName,
      participantEmail,
      organizerName,
      timezone,
    } = data;

    const subject = `Meeting Invitation: ${title}`;

    const formatDateTime = (date: Date): string => {
      return date.toLocaleString("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const startDateTime = formatDateTime(startTime);
    const endDateTime = endTime ? formatDateTime(endTime) : null;

    const rolesText =
      roles && Object.keys(roles).length > 0
        ? `\n\nRoles:\n${Object.entries(roles)
            .map(([role, name]) => `• ${role}: ${name}`)
            .join("\n")}`
        : "";

    const body = `
Hello ${participantName || "Participant"},

You have been invited to the following meeting:

Meeting Title: ${title}
${description ? `Description: ${description}` : ""}
Start Time: ${startDateTime}
${endDateTime ? `End Time: ${endDateTime}` : ""}
${location ? `Location/Meeting Link: ${location}` : ""}
${hostEmail ? `Host: ${hostEmail}` : ""}
Organizer: ${organizerName}
Timezone: ${timezone}${rolesText}

Please join the meeting at the specified time.

Best regards,
${organizerName}
CHW Training Platform
    `.trim();

    try {
      await sendEmail({
        to: participantEmail,
        subject,
        body,
      });
    } catch (error) {
      console.error("Failed to send meeting invitation email:", error);
      throw error;
    }
  }

  static async sendMeetingUpdate(
    data: MeetingInvitationData & { changes: string[] },
  ): Promise<void> {
    const subject = `Meeting Updated: ${data.title}`;

    const formatDateTime = (date: Date): string => {
      return date.toLocaleString("en-US", {
        timeZone: data.timezone,
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const startDateTime = formatDateTime(data.startTime);
    const endDateTime = data.endTime ? formatDateTime(data.endTime) : null;

    const body = `
Hello ${data.participantName || "Participant"},

The following meeting has been updated:

Meeting Title: ${data.title}
${data.description ? `Description: ${data.description}` : ""}
Start Time: ${startDateTime}
${endDateTime ? `End Time: ${endDateTime}` : ""}
${data.location ? `Location/Meeting Link: ${data.location}` : ""}


Please review the updated meeting details.

Best regards,
${data.organizerName}
CHW Training Platform
    `.trim();

    try {
      await sendEmail({
        to: data.participantEmail,
        subject,
        body,
      });
    } catch (error) {
      console.error("Failed to send meeting update email:", error);
      throw error;
    }
  }

  static async sendMeetingCancellation(
    data: MeetingInvitationData,
  ): Promise<void> {
    const subject = `Meeting Cancelled: ${data.title}`;

    const body = `
Hello ${data.participantName || "Participant"},

The following meeting has been cancelled:

Meeting Title: ${data.title}
${data.description ? `Description: ${data.description}` : ""}

If you have any questions, please contact the organizer.

Best regards,
${data.organizerName}
CHW Training Platform
    `.trim();

    try {
      await sendEmail({
        to: data.participantEmail,
        subject,
        body,
      });
    } catch (error) {
      console.error("Failed to send meeting cancellation email:", error);
      throw error;
    }
  }
}
