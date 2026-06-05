import api from "./api";
import { IQuestionnaire } from "@/types";

export interface CreateQuestionnairePayload {
  question: string;
  feedbackStatement?: string;
  allowMultiple?: boolean;
  courseId?: string | null;
  midTestId?: string | null;
}

export const createQuestionnaire = async (
  data: CreateQuestionnairePayload
): Promise<IQuestionnaire> => {
  // Questionnaire endpoint uses multer (multipart/form-data)
  const form = new FormData();
  form.append("question", data.question);
  if (data.feedbackStatement) form.append("feedbackStatement", data.feedbackStatement);
  form.append("allowMultiple", String(data.allowMultiple ?? false));
  if (data.courseId) form.append("courseId", data.courseId);
  if (data.midTestId) form.append("midTestId", data.midTestId);

  const res = await api.post("/questionnaires", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
};

export const updateQuestionnaire = async (
  id: string,
  data: Partial<CreateQuestionnairePayload>
): Promise<IQuestionnaire> => {
  const res = await api.put(`/questionnaires/${id}`, {
    question: data.question,
    feedbackStatement: data.feedbackStatement,
    allowMultiple: data.allowMultiple,
  });
  return res.data?.data;
};

export const deleteQuestionnaire = async (id: string): Promise<void> => {
  await api.delete(`/questionnaires/${id}`);
};

export const createOption = async (data: {
  label: string;
  questionnaireId: string;
}): Promise<void> => {
  // Option endpoint uses multer (multipart/form-data)
  const form = new FormData();
  form.append("label", data.label);
  form.append("questionnaireId", data.questionnaireId);

  await api.post("/options", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateOption = async (
  id: string,
  data: { label: string; questionnaireId: string }
): Promise<void> => {
  await api.put(`/options/${id}`, data);
};

export const deleteOption = async (id: string): Promise<void> => {
  await api.delete(`/options/${id}`);
};

export const createAnswer = async (data: {
  label: string;
  questionnaireId: string;
}): Promise<void> => {
  // Answer endpoint uses multer (multipart/form-data)
  const form = new FormData();
  form.append("label", data.label);
  form.append("questionnaireId", data.questionnaireId);

  await api.post("/answers", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteAnswer = async (id: string): Promise<void> => {
  await api.delete(`/answers/${id}`);
};
