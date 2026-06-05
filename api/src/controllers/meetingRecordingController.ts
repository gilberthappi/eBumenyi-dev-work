/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Post,
  Get,
  Patch,
  Delete,
  Route,
  Tags,
  Security,
  Middlewares,
  Request,
  Path,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { roles } from "../utils/roles";
import { checkRole } from "../middlewares";
import { MeetingRecordingService } from "../services/meetingRecordingService";

// Configure storage for recordings
const recordingStorage = multer.diskStorage({
  destination: (req: any, file, cb) => {
    const eventId = req.body.eventId || req.query.eventId;

    if (!eventId) {
      return cb(new Error("eventId is required for recording upload"), "");
    }

    const uploadPath = path.join(
      process.cwd(),
      "uploads",
      "Recordings",
      eventId,
    );

    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, "");
    }
  },
  filename: (req: any, file, cb) => {
    const userId = req.body.userId || req.query.userId || req.user?.id;

    if (!userId) {
      return cb(new Error("userId is required for recording upload"), "");
    }

    const ext = path.extname(file.originalname) || ".mp4";
    cb(null, `${userId}${ext}`);
  },
});

const recordingUpload = multer({
  storage: recordingStorage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(
        new Error("Only video files are allowed for recordings") as any,
        false,
      );
    }
  },
});

@Route("/api/recordings")
@Tags("Meeting Recordings")
export class MeetingRecordingController {
  /**
   * Upload a meeting recording
   * @summary Upload meeting recording
   */
  @Post("/upload")
  @Security("jwt")
  @Middlewares(recordingUpload.single("recording"))
  public async uploadRecording(@Request() req: ExpressRequest): Promise<any> {
    try {
      if (!req.file) {
        return { statusCode: 400, message: "No recording file provided" };
      }

      const file = req.file;
      const eventId = req.body.eventId || req.query.eventId;
      const userId =
        req.body.userId || req.query.userId || (req as any).user?.id;
      const title = req.body.title;

      if (!eventId || !userId) {
        return { statusCode: 400, message: "Missing eventId or userId" };
      }

      const url = `/uploads/Recordings/${eventId}/${file.filename}`;

      return await MeetingRecordingService.createRecording({
        eventId,
        userId,
        url,
        title,
      });
    } catch (error: any) {
      console.error("❌ Recording upload error:", error);
      return {
        statusCode: 500,
        message: error?.message || "Failed to upload recording",
      };
    }
  }

  /**
   * Sync a recording from a remote URL (e.g. Stream) to local storage
   * @summary Sync remote recording
   */
  @Post("/sync")
  @Security("jwt")
  public async syncRecording(@Request() req: ExpressRequest): Promise<any> {
    try {
      const { eventId, userId, recordingUrl, title } = req.body;

      if (!eventId || !userId || !recordingUrl) {
        return {
          statusCode: 400,
          message: "Missing eventId, userId, or recordingUrl",
        };
      }

      return await MeetingRecordingService.syncRecordingFromUrl({
        eventId,
        userId,
        recordingUrl,
        title,
      });
    } catch (error: any) {
      console.error("❌ Recording sync error:", error);
      return {
        statusCode: 500,
        message: error?.message || "Failed to sync recording",
      };
    }
  }

  /**
   * Publish a recording with audience targeting (Admin only)
   * @summary Publish recording
   */
  @Patch("/{id}/publish")
  @Security("jwt")
  @Middlewares(checkRole(roles.ADMIN, roles.TESTER))
  public async publishRecording(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<any> {
    try {
      const publishedTo: "ALL" | "TRAINEES" | "INVITED" =
        req.body?.publishedTo ?? "ALL";
      const invitedUserIds: string[] | undefined = req.body?.invitedUserIds;
      return await MeetingRecordingService.publishRecording(
        id,
        publishedTo,
        invitedUserIds,
      );
    } catch (error: any) {
      console.error("❌ Publish recording error:", error);
      return {
        statusCode: error?.statusCode || 500,
        message: error?.message || "Failed to publish recording",
      };
    }
  }

  /**
   * Unpublish a recording — hides it from trainees (Admin only)
   * @summary Unpublish recording
   */
  @Patch("/{id}/unpublish")
  @Security("jwt")
  @Middlewares(checkRole(roles.ADMIN, roles.TESTER))
  public async unpublishRecording(@Path() id: string): Promise<any> {
    try {
      return await MeetingRecordingService.unpublishRecording(id);
    } catch (error: any) {
      console.error("❌ Unpublish recording error:", error);
      return {
        statusCode: error?.statusCode || 500,
        message: error?.message || "Failed to unpublish recording",
      };
    }
  }

  /**
   * Delete a recording and its local file (Admin only)
   * @summary Delete recording
   */
  @Delete("/{id}")
  @Security("jwt")
  @Middlewares(checkRole(roles.ADMIN, roles.TESTER))
  public async deleteRecording(@Path() id: string): Promise<any> {
    try {
      return await MeetingRecordingService.deleteRecording(id);
    } catch (error: any) {
      console.error("❌ Delete recording error:", error);
      return {
        statusCode: error?.statusCode || 500,
        message: error?.message || "Failed to delete recording",
      };
    }
  }

  /**
   * Get published recordings visible to the calling user
   * @summary Get published recordings
   */
  @Get("/published")
  @Security("jwt")
  public async getPublishedRecordings(
    @Request() req: ExpressRequest,
  ): Promise<any> {
    const userId = (req as any).user?.id;
    const userRoles: string[] = (req as any).user?.roles ?? [];
    if (!userId) {
      return { statusCode: 401, message: "Unauthorized" };
    }
    return await MeetingRecordingService.getPublishedRecordings(
      userId,
      userRoles,
    );
  }

  /**
   * Get recordings for a specific event
   * @summary Get event recordings
   */
  @Get("/event/{eventId}")
  @Security("jwt")
  public async getEventRecordings(@Path() eventId: string): Promise<any> {
    return await MeetingRecordingService.getRecordingsByEvent(eventId);
  }

  /**
   * Get recordings for the currently authenticated user
   * @summary Get my recordings
   */
  @Get("/me")
  @Security("jwt")
  public async getMyRecordings(@Request() req: ExpressRequest): Promise<any> {
    const userId = (req as any).user?.id;
    if (!userId) {
      return { statusCode: 401, message: "Unauthorized" };
    }
    return await MeetingRecordingService.getMyRecordings(userId);
  }

  /**
   * Get all recordings with full details (Admin only)
   * @summary Get all recordings
   */
  @Get("/")
  @Security("jwt")
  @Middlewares(checkRole(roles.ADMIN, roles.TESTER))
  public async getAllRecordings(): Promise<any> {
    return await MeetingRecordingService.getAllRecordings();
  }
}
