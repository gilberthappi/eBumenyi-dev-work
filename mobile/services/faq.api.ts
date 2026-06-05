import { CreateFaqDto, GetFaqsResponse } from '@/types';
import httpClient from './httpClient';


export const createFaq = async (data: CreateFaqDto | FormData) => {
  // If it's FormData (for binary audio), send as multipart
  if (data instanceof FormData) {
    const response = await httpClient.post('/faqs', data, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // If message is a string (text), send as JSON
  if (typeof data.message === 'string') {
    const response = await httpClient.post('/faqs', data as CreateFaqDto, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  // If message contains binary data, send as multipart
  const formData = new FormData();
  formData.append('slideId', data.slideId);
  formData.append('isPublished', data.isPublished ? 'true' : 'false');
  formData.append('message', data.message); // Binary data
  
  const response = await httpClient.post('/faqs', formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getFaqByCourse = async (courseId: string): Promise<GetFaqsResponse> => {
  const response = await httpClient.get(`/faqs/by-course/${courseId}`);
  return (response as any).data as GetFaqsResponse;
};

export const deleteFaq = async (faqId: string) => {
  const response = await httpClient.delete(`/faqs/${faqId}`);
  return (response as any).data;
};