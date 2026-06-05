import api from "./api";
import { IMidTest } from "@/types";

export interface IMidTestAttemptResult {
  id: string;
  marks: number;
  isCompleted: boolean;
}

interface QuestionAnswer {
  questionnaireId: string;
  selectedAnswerIds: string[];
}

export const getMidTestById = async (midTestId: string): Promise<IMidTest | null> => {
  const res = await api.get(`/mid-tests/${midTestId}`);
  return res.data?.data ?? null;
};

export const submitMidTestAttempt = async (
  midTestId: string,
  questionAnswers: QuestionAnswer[]
): Promise<IMidTestAttemptResult> => {
  const res = await api.post("/attempts", { midTestId, questionAnswers });
  return res.data?.data;
};
