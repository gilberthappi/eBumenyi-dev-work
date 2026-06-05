import { IChapter, ICourse, IPaged, IResponse, TDashboardStatisticsResponse } from "@/types";
import api from "./api";
import { getBackendURL } from "@/config/api.config";

export const getAllCourses = async (params?: string): Promise<IPaged<ICourse[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/courses${queryParams}`)).data;
};

export const getAllCoursesStats = async (): Promise<TDashboardStatisticsResponse> => {
  return (await api.get('/courses/dashboard/statistics')).data;
};

export const getAllCoursesNoPagination = async (params?: string): Promise<IResponse<ICourse[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/courses/all${queryParams}`)).data;
};

export const getCourseById = async (id: string): Promise<IResponse<ICourse>> => {
  return (await api.get(`/courses/${id}`)).data;
};

export const createCourse = async (
  data: Record<string, unknown>
): Promise<unknown> => {
  return (await api.post("/courses/super", data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })).data;
};

export const updateCourse = async (
  id: string,
  data: Record<string, unknown>,
): Promise<unknown> => {
  return (await api.put(`/courses/super/${id}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })).data;
};

export const deleteCourse = async (id: string): Promise<number> => {
  return (await api.delete(`/courses/${id}`)).data;
};

const VIDEO_EXTS = new Set(["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv", "m4v", "3gp"]);

function detectSlideFileKind(file: File): "video" | "pdf" | "image" {
  // Prefer MIME type, fall back to extension (file.type can be empty on some browsers/OS)
  const mime = file.type.toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";

  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (ext === "pdf") return "pdf";
  return "image";
}

/**
 * Upload a single slide file to the server and return a persisted URL.
 *
 * Endpoint routing (each uses a dedicated multer parser so the stream
 * is only consumed once — chaining two parsers breaks on non-video files):
 *   video  → POST /upload/video    field: "video"   → local path, prefixed with backend base URL
 *   pdf    → POST /upload/document field: "document" → Cloudinary secure_url
 *   image  → POST /upload/image    field: "image"   → Cloudinary secure_url
 */
export const uploadSlideFile = async (file: File): Promise<string> => {
  const kind = detectSlideFileKind(file);

  let endpoint: string;
  let fieldName: string;

  if (kind === "video") {
    endpoint = "/upload/video";
    fieldName = "video";
  } else if (kind === "pdf") {
    endpoint = "/upload/document";
    fieldName = "document";
  } else {
    endpoint = "/upload/image";
    fieldName = "image";
  }

  const form = new FormData();
  form.append(fieldName, file);

  const response = await api.post(endpoint, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  let url: string = response.data?.data?.url;
  if (!url) throw new Error("Upload succeeded but no URL was returned");

  // Video uploads return a server-relative path (e.g. /uploads/videos/uuid.mp4).
  // Prefix with the backend base URL so it works from the browser.
  if (url.startsWith("/")) {
    url = `${getBackendURL()}${url}`;
  }

  return url;
};

import { IMyCoursesResponse, IMyCertificatesResponse, IMyCertificate, EnrolledCourse } from "@/types";

export const getCourseSectionsWithChapters = async (courseId: string): Promise<IResponse<ICourse>> => {
  return (await api.get(`/courses/${courseId}/sections`)).data;
};

export const getChapterSlides = async (chapterId: string): Promise<IResponse<IChapter>> => {
  return (await api.get(`/courses/chapters/${chapterId}/slides`)).data;
};

export const getChapterMidTestId = async (chapterId: string): Promise<string | null> => {
  try {
    const res = await api.get(`/courses/chapters/${chapterId}/midtest`);
    return res.data?.data?.id ?? null;
  } catch {
    return null;
  }
};

export const getCoursesWithProgress = async (): Promise<ICourse[]> => {
  const res = await api.get("/courses/myall");
  return (res.data?.data as ICourse[]) ?? [];
};

export const getMyCourses = async (): Promise<IMyCoursesResponse> => {
  return (await api.get("/courses/myall")).data;
};

export const getMyCertificates = async (): Promise<IMyCertificatesResponse> => {
  // Step 1: get enrolled courses
  const coursesRes = await api.get("/courses/myall");
  const enrolledCourses: EnrolledCourse[] =
    coursesRes.data?.data?.enrolledCourses ?? [];

  // Step 2: for each completed course, fetch its certificate
  const completedCourses = enrolledCourses.filter((c) => c.isCompleted);
  const certResults = await Promise.allSettled(
    completedCourses.map((c) =>
      api.get(`/certificate/my-certificate/course/${c.courseId}`)
    )
  );

  const certificates: IMyCertificate[] = certResults
    .filter((r) => r.status === "fulfilled")
    .map((r) => {
      const res = (r as PromiseFulfilledResult<{ data: { data: IMyCertificate & { course?: { title?: string } } } }>).value;
      const raw = res.data?.data;
      return {
        id: raw?.id ?? "",
        courseId: raw?.courseId ?? "",
        // Backend returns course title inside a nested course object or not at all.
        // Fall back to matching against enrolledCourses by courseId.
        courseTitle:
          raw?.course?.title ??
          enrolledCourses.find((c) => c.courseId === raw?.courseId)?.courseTitle ??
          "Isomo",
        pdf: raw?.pdf ?? "",
        createdAt: raw?.createdAt ?? "",
        updatedAt: raw?.updatedAt ?? "",
      };
    })
    .filter((c) => c.id !== "");

  return {
    message: "ok",
    statusCode: 200,
    data: certificates,
  };
};
