import httpClient from './httpClient';
import { ICertificateResponse, ICertificateListResponse } from '@/types';

export const getCertificate = async (courseId: string): Promise<ICertificateResponse> => {
  const response = await httpClient.get(`/certificates/my-certificate/course/${courseId}`);
  return (response as any).data as ICertificateResponse;
};

export const generateCertificate = async (courseId: string): Promise<ICertificateResponse> => {
  const response = await httpClient.post(`/certificates/generate`, { courseId });
  return (response as any).data as ICertificateResponse;
};

export const getMyCertificates = async (): Promise<ICertificateListResponse> => {
  const response = await httpClient.get('/certificates/my-certificates');
  return (response as any).data as ICertificateListResponse;
};

export const regenerateCertificate = async (certificateId: string): Promise<ICertificateResponse> => {
  const response = await httpClient.post(`/certificates/regenerate/${certificateId}`);
  return (response as any).data as ICertificateResponse;
};

export const regenerateMyCertificate = async (courseId: string): Promise<ICertificateResponse> => {
  const response = await httpClient.post(`/certificates/my-certificate/regenerate/${courseId}`);
  return (response as any).data as ICertificateResponse;
};