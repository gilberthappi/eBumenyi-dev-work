import Toast from 'react-native-toast-message';

type ToastType = "success" | "error" | "info";

interface HandleResponseProps {
  response: any;
  successMessage?: string;
  errorMessage?: string;
  setToastMessage?: (message: string | null) => void;
  setToastType?: (type: ToastType) => void;
  successConfig?: Partial<ToastConfig>;
  errorConfig?: Partial<ToastConfig>;
}

interface ToastConfig {
  type: ToastType;
  text1: string;
  text2?: string;
  visibilityTime?: number;
  autoHide?: boolean;
  props?: any;
}

export const handleResponse = ({
  response,
  successMessage = '',
  errorMessage = '',
  setToastMessage,
  setToastType,
  successConfig = {},
  errorConfig = {}
}: HandleResponseProps) => {
  // Gather possible status fields from various response shapes
  const candidateStatuses: any[] = [
    response?.status,
    response?.status_code,
    response?.statusCode,
    response?.statusCode && response.statusCode, // redundant but explicit
    response?.data?.status,
    response?.data?.status_code,
    response?.data?.statusCode,
    response?.data?.statusCode && response.data.statusCode,
    response?.response?.status,
    response?.response?.data?.statusCode,
    response?.response?.data?.status,
    response?.statusCode ?? response?.data?.statusCode ?? response?.response?.status,
  ];

  // Find first candidate that can be interpreted as a number or a meaningful string
  let numericStatus: number | null = null;
  for (const s of candidateStatuses) {
    if (s === null || s === undefined) continue;
    if (typeof s === 'number' && !Number.isNaN(s)) { numericStatus = s; break; }
    if (typeof s === 'string') {
      const parsed = parseInt(s.replace(/[^0-9]/g, ''), 10);
      if (!Number.isNaN(parsed)) { numericStatus = parsed; break; }
      // also treat literal 'success'/'ok'
      if (s.toLowerCase().includes('success') || s.toLowerCase().includes('ok')) { numericStatus = 200; break; }
    }
  }

  let isSuccess: boolean;
  if (numericStatus !== null) {
    isSuccess = Math.floor(numericStatus / 100) === 2;
  } else {
    // fallback to boolean-like indicators
    isSuccess = !!(response?.success || response?.ok || response?.data?.success || response?.data?.ok || response?.status === 'success' || response?.data?.status === 'success');
  }

  // Extract a meaningful message from common response shapes.
  const extractMessage = () => {
    // Prefer server-provided nested messages even when an axios Error object was passed
    if (typeof response?.data?.message === 'string' && response.data.message.trim()) return response.data.message;
    if (typeof response?.response?.data?.message === 'string' && response.response.data.message.trim()) return response.response.data.message;
    // common top-level message
    if (typeof response?.message === 'string' && response.message.trim()) return response.message;
    // nested data.message (redundant but safe)
    if (typeof response?.data?.message === 'string' && response.data.message.trim()) return response.data.message;
    // error object message
    if (typeof response?.error?.message === 'string' && response.error.message.trim()) return response.error.message;
    // sometimes errors are returned as array or object
    const dataErrors = response?.data?.errors ?? response?.errors ?? response?.response?.data?.errors ?? response?.response?.errors ?? null;
    if (Array.isArray(dataErrors) && dataErrors.length) return dataErrors.join(', ');
    if (typeof dataErrors === 'string' && dataErrors.trim()) return dataErrors;
    // explicit override provided by caller
    if (isSuccess && successMessage) return successMessage;
    if (!isSuccess && errorMessage) return errorMessage;
    // fallback messages
    return isSuccess ? (successMessage || 'Operation successful') : (errorMessage || 'Havutsemo akabazo, mugerageze mukanya');
  };

  const message = extractMessage();
  console.log('Toast message:', message);
  const type: ToastType = isSuccess ? 'success' : 'error';

  setToastMessage?.(message);
  setToastType?.(type);

  // If the message is long, split into two lines for the toast (text1, text2).
  const splitMessageToTwo = (msg: string, maxLen = 80) => {
    if (!msg || !msg.trim()) return { text1: 'Havutsemo akabazo, mugerageze mukanya', text2: undefined };
    if (msg.length <= maxLen) return { text1: msg, text2: undefined };
    // Prefer splitting at the end of the first sentence within maxLen
    const sentenceEnd = msg.slice(0, maxLen + 1).lastIndexOf('.')
    if (sentenceEnd > 0 && sentenceEnd < msg.length - 1) {
      const a = msg.slice(0, sentenceEnd + 1).trim();
      const b = msg.slice(sentenceEnd + 1).trim();
      return { text1: a, text2: b };
    }
    // Otherwise split at the last whitespace before maxLen
    let idx = msg.lastIndexOf(' ', maxLen);
    if (idx <= 0) idx = maxLen; // fallback hard split
    const a = msg.slice(0, idx).trim();
    const b = msg.slice(idx).trim();
    return { text1: a, text2: b };
  };

  const { text1, text2 } = splitMessageToTwo(message, 80);
  const visibilityTime = text2 ? 5000 : 3000;

  Toast.show({
    type,
    text1: text1 || 'Havutsemo akabazo, mugerageze mukanya',
    ...(text2 ? { text2 } : {}),
    visibilityTime,
    autoHide: true,
    ...(isSuccess ? successConfig : errorConfig)
  });

  return isSuccess;
};