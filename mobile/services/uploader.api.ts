import httpClient from "./httpClient";
// Types matching your backend response
export interface FileUploadResponse {
  statusCode: number;
  message: string;
  data: {
    url: string;
    publicId: string;
    originalName: string;
    size: number;
    format: string;
  } | null;
}

export interface MultipleFileUploadResponse {
  statusCode: number;
  message: string;
  data: {
    url: string;
    publicId: string;
    originalName: string;
    size: number;
    format: string;
    fieldName: string;
  }[]; // use [] syntax per eslint rule
}

// Upload single file
export const uploadSingleFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient.post<FileUploadResponse>('/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Upload video file
export const uploadVideoFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('video', file);

  const response = await httpClient.post<FileUploadResponse>('/upload/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Upload multiple files
export const uploadMultipleFiles = async (files: File[]): Promise<MultipleFileUploadResponse> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await httpClient.post<MultipleFileUploadResponse>('/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Upload files with any field names
export const uploadAnyFiles = async (files: { file: File; fieldName: string }[]): Promise<MultipleFileUploadResponse> => {
  const formData = new FormData();
  files.forEach(({ file, fieldName }) => {
    formData.append(fieldName, file);
  });

  const response = await httpClient.post<MultipleFileUploadResponse>('/upload/any', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Upload image file specifically
export const uploadImage = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await httpClient.post<FileUploadResponse>('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Upload document file specifically
export const uploadDocument = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await httpClient.post<FileUploadResponse>('/upload/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Helper function to determine upload type based on file
export const uploadFileByType = async (file: File): Promise<FileUploadResponse> => {
  if (!file.type) {
    throw new Error('File type is undefined');
  }
  
  if (file.type.startsWith('image/')) {
    return uploadImage(file);
  } else if (
    file.type === 'application/pdf' ||
    file.type === 'application/msword' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/vnd.ms-powerpoint' ||
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    file.type === 'text/plain'
  ) {
    return uploadDocument(file);
  } else {
    return uploadSingleFile(file);
  }
};
