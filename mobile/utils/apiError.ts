/**
 * Normalize Axios / API errors into a user-visible string (Kinyarwanda-friendly fallbacks).
 */
export function getApiErrorMessage(
  e: unknown,
  fallbackRw = "Ntibishobotse kugira ubutumwa bwihariye ubu.",
): string {
  const ax = e as {
    response?: {
      status?: number;
      data?: { message?: string; error?: string } | string;
    };
    message?: string;
  };

  const data = ax.response?.data;
  if (typeof data === "string" && data.trim().length > 0) {
    return data;
  }
  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.length > 0) {
      return data.message;
    }
    if (typeof data.error === "string" && data.error.length > 0) {
      return data.error;
    }
  }

  const msg = ax.message;
  if (msg && !msg.startsWith("Request failed with status code")) {
    return msg;
  }

  if (ax.response?.status === 404) {
    return "Ntibibonetse kuri seriveri (404). Reba ko ukoresha seriveri ishyizweho kandi ko wemeje gukoresha API ya hafi (localhost).";
  }

  return fallbackRw;
}
