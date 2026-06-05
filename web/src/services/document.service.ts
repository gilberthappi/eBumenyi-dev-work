import api from "./api";

export interface IDocument {
  id: string;
  fileName: string;
  file: string;
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllDocuments = async (): Promise<{ data: IDocument[] }> => {
  const res = await api.get('/documents');
  return res.data;
};

export const createDocument = async (payload: { fileName: string; file: string; courseId: string; }) => {
  const res = await api.post('/documents', payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
};

export const updateDocument = async (id: string, payload: { fileName: string; file: string; courseId: string; }) => {
  const res = await api.put(`/documents/${id}`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
};

export const deleteDocument = async (id: string) => {
  const res = await api.delete(`/documents/${id}`);
  return res.data;
};
