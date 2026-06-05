import api from "./api";
import { IQuestionnaire } from "@/types";

export interface IFinalTestData {
  id: string;
  courseId: string;
  questionToBeAnswered: number;
  marksToPass: number;
  description?: string;
  questionnaires: IQuestionnaire[];
}

export interface IFinalTestAttemptResult {
  id: string;
  marks: number;
  isCompleted: boolean;
}

interface QuestionAnswer {
  questionnaireId: string;
  selectedAnswerIds: string[];
}

export const getCourseFinalTestIds = async (
  courseId: string
): Promise<{ finalTestId: string | null; finalExamId: string | null }> => {
  try {
    const res = await api.get(`/courses/${courseId}`);
    const data = res.data?.data;
    const activeTest = data?.finalTest?.find((t: { isPublished: boolean }) => t.isPublished);
    const activeExam = data?.finalExam?.find((e: { isPublished: boolean }) => e.isPublished);
    return {
      finalTestId: activeTest?.id ?? null,
      finalExamId: activeExam?.id ?? null,
    };
  } catch {
    return { finalTestId: null, finalExamId: null };
  }
};

const normalizeFinalTestData = (raw: Record<string, unknown>): IFinalTestData => ({
  id: raw.id as string,
  courseId: raw.courseId as string,
  questionToBeAnswered: raw.questionToBeAnswered as number,
  marksToPass: raw.marksToPass as number,
  description: raw.description as string | undefined,
  questionnaires: ((raw.course as Record<string, unknown>)?.questionnaires as IQuestionnaire[]) ?? [],
});

export const getFinalTestById = async (id: string): Promise<IFinalTestData | null> => {
  const res = await api.get(`/final-tests/${id}`);
  const raw = res.data?.data;
  if (!raw || raw.isPublished === false) return null;
  return normalizeFinalTestData(raw);
};

export const getFinalExamById = async (id: string): Promise<IFinalTestData | null> => {
  const res = await api.get(`/final-exams/${id}`);
  const raw = res.data?.data;
  if (!raw || raw.isPublished === false) return null;
  return normalizeFinalTestData(raw);
};

export const submitFinalTestAttempt = async (
  finalTestId: string,
  questionAnswers: QuestionAnswer[]
): Promise<IFinalTestAttemptResult> => {
  const res = await api.post("/attempts", { finalTestId, questionAnswers });
  return res.data?.data;
};

export const submitFinalExamAttempt = async (
  finalExamId: string,
  questionAnswers: QuestionAnswer[]
): Promise<IFinalTestAttemptResult> => {
  const res = await api.post("/attempts", { finalExamId, questionAnswers });
  return res.data?.data;
};
