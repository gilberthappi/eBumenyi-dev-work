import api from "./api";

export interface IPreTestOption {
  id: string;
  label: string;
  image?: string;
}

export interface IPreTestQuestion {
  id: string;
  question: string;
  questionImage?: string;
  feedbackStatement?: string;
  allowMultiple: boolean;
  options: IPreTestOption[];
  answers?: IPreTestOption[];
}

export interface IPreTest {
  id: string;
  courseId: string;
  questionToBeAnswered: number;
  marksToPass: number;
  description?: string;
  isPublished: boolean;
  course?: {
    title?: string;
    questionnaires?: IPreTestQuestion[];
  };
}

export interface IAttemptResult {
  id: string;
  marks: number;
  isCompleted: boolean;
}

interface QuestionAnswer {
  questionnaireId: string;
  selectedAnswerIds: string[];
}

export const getPreTestByCourseId = async (courseId: string): Promise<IPreTest | null> => {
  const listRes = await api.get("/pre-tests/all");
  const all: IPreTest[] = listRes.data?.data ?? [];
  // isPublished may be absent in the response — only exclude explicit false
  const match = all.find((pt) => pt.courseId === courseId && pt.isPublished !== false);
  if (!match) return null;
  const detailRes = await api.get(`/pre-tests/${match.id}`);
  return detailRes.data?.data ?? null;
};

export const submitPreTestAttempt = async (
  preTestId: string,
  questionAnswers: QuestionAnswer[]
): Promise<IAttemptResult> => {
  const res = await api.post("/attempts", { preTestId, questionAnswers });
  return res.data?.data;
};
