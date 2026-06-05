import { ICourse, ISection, IChapter, ISlide, IQuestionnaire, IMidTest } from "@/types";

// Helper interfaces for the form (keeping the ones that don't exist in index.ts)
export interface ActivityOption {
  label?: string;
  image?: string;
  imageFile?: File | null;
  imagePreview?: string | null;
}

export interface ActivityQuestion {
  question: string;
  questionImage?: string;
  feedbackStatement?: string;
  questionImageFile?: File | null;
  questionImagePreview?: string | null;
  allowMultiple: boolean;
  options: ActivityOption[];
  correctAnswer: ActivityOption;
  correctAnswers?: number[];
  correctAnswerIndex?: number;
}

export interface ActivityInstruction {
  questionToBeAnswered: number;
  marksToPass: number;
  description: string;
}

export interface CourseSlideForm extends Omit<ISlide, 'id' | 'chapterId' | 'createdAt' | 'updatedAt'> {
  type?: string; // Add type property for UI purposes
  slideFile?: File | null;
  slidePreview?: string | null;
  isActivitySlide?: boolean;
  isPreTestSlide?: boolean;
  isFinalTestSlide?: boolean;
  activity?: {
    instruction: ActivityInstruction;
    questions: ActivityQuestion[];
  };
}

export interface CourseChapterForm extends Omit<IChapter, 'id' | 'sectionId' | 'createdAt' | 'updatedAt' | 'slides' | 'midTest'> {
  slides: CourseSlideForm[];
  midTestSlide?: CourseSlideForm;
}

export interface CourseSectionForm extends Omit<ISection, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'chapters'> {
  chapters: CourseChapterForm[];
}

export interface CourseFormData {
  title: string;
  coverIcon: string;
  description: string;
  isPublished: boolean;
  intro: {
    title: string;
    summary: string;
    bannerImage: string;
    thumbnail: string;
  };
  sections: CourseSectionForm[];
  preTest: {
    questionToBeAnswered: number;
    marksToPass: number;
    description: string;
  };
  finalTest: {
    questionToBeAnswered: number;
    marksToPass: number;
    description: string;
  };
  finalExam: {
    questionToBeAnswered: number;
    marksToPass: number;
    description: string;
  };
  questionBank: ActivityQuestion[];
}

// Transform functions
export const transformCourseToFormData = (course: ICourse): CourseFormData => {
   const questionBank: ActivityQuestion[] = (course.questionnaires || []).map(q => 
    transformQuestionnaireToActivity(q)
  );
  return {
    title: course.title,
    coverIcon: course.coverIcon,
    description: course.description,
    isPublished: course.isPublished,
    intro: {
      title: course.intro?.title || course.title,
      summary: course.intro?.summary || "",
      bannerImage: course.intro?.bannerImage || "",
      thumbnail: course.intro?.thumbnail || "",
    },
    sections: course.sections?.map(transformSectionToFormData) || [],
    preTest: {
      questionToBeAnswered: course.preTests[0]?.questionToBeAnswered || 0,
      marksToPass: course.preTests[0]?.marksToPass || 0,
      description: course.preTests[0]?.description || "",
    },
    finalTest: {
      questionToBeAnswered: course.finalTest[0]?.questionToBeAnswered || 0,
      marksToPass: course.finalTest[0]?.marksToPass || 0,
      description: course.finalTest[0]?.description || "",
    },
     finalExam: {
      questionToBeAnswered: course.finalExam[0]?.questionToBeAnswered || 0,
      marksToPass: course.finalExam[0]?.marksToPass || 0,
      description: course.finalExam[0]?.description || "",
    },
    questionBank: questionBank,
  };
};

export const transformSectionToFormData = (section: ISection): CourseSectionForm => {
  return {
    title: section.title,
    description: section.description,
    totalChapter: section.totalChapter,
    chapters: section.chapters?.map(transformChapterToFormData) || [],
  };
};

export const transformChapterToFormData = (chapter: IChapter): CourseChapterForm => {
  return {
    title: chapter.title,
    description: chapter.description,
    totalSlide: chapter.totalSlide,
    chapterNumber: chapter.chapterNumber,
    activityAt: chapter.activityAt,
    lessonDuration: chapter.lessonDuration,
    isPublished: chapter.isPublished,
    slides: chapter.slides?.map(transformSlideToFormData) || [],
    midTestSlide: chapter.midTest ? transformMidTestToSlideForm(chapter.midTest) : undefined,
  };
};

export const transformMidTestToSlideForm = (midTest: IMidTest): CourseSlideForm => {
  return {
    note: 'Mid Test',
    description: midTest.description,
    slideNumber: 50,
    file: "",
    isPublished: midTest.isPublished ?? true,
    slideFile: null,
    slidePreview: null,
    isActivitySlide: true,
    isPreTestSlide: false,
    isFinalTestSlide: false,
    activity: {
      instruction: {
        questionToBeAnswered: midTest.questionToBeAnswered,
        marksToPass: midTest.marksToPass,
        description: midTest.description,
      },
      questions: midTest.questionnaires?.map(transformQuestionnaireToActivity) || [],
    },
  };
};

export const transformSlideToFormData = (slide: ISlide): CourseSlideForm => {
  // Auto-detect slide type based on file URL
  let slideType = "";
  if (slide.file) {
    const urlLower = slide.file.toLowerCase();
    if (urlLower.includes('.mp4') || urlLower.includes('.webm') || urlLower.includes('.avi') || urlLower.includes('.mov')) {
      slideType = "video";
    } else if (urlLower.includes('.pdf') || urlLower.includes('.doc') || urlLower.includes('.docx') || urlLower.includes('.ppt') || urlLower.includes('.pptx')) {
      slideType = "document";
    } else if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.png') || urlLower.includes('.gif') || urlLower.includes('.webp')) {
      slideType = "image";
    }
  }

  return {
    note: slide.note,
    description: slide.description,
    slideNumber: slide.slideNumber,
    file: slide.file,
    isPublished: slide.isPublished,
    type: slideType,
    slideFile: null,
    slidePreview: slide.file || null, // Use the existing file URL as preview
    isActivitySlide: false,
    isPreTestSlide: false,
    isFinalTestSlide: false,
  };
};

export const transformQuestionnaireToActivity = (questionnaire: IQuestionnaire): ActivityQuestion => {
  return {
    question: questionnaire.question,
    questionImage: questionnaire.questionImage || "",
    feedbackStatement: questionnaire.feedbackStatement || "",
    questionImageFile: null,
    questionImagePreview: questionnaire.questionImage || null,
    allowMultiple: questionnaire.allowMultiple,
    options: [
      ...questionnaire.options.map(option => ({
        label: option.label,
        image: option.image || "",
        imageFile: null,
        imagePreview: option.image || null,
      })),
    ],
    correctAnswer: questionnaire.answers?.[0] ? {
      label: questionnaire.answers[0].label,
      image: questionnaire.answers[0].image || "",
      imageFile: null,
      imagePreview: questionnaire.answers[0].image || null,
    } : { label: "", image: "", imageFile: null, imagePreview: null },
    correctAnswers: questionnaire.allowMultiple ? 
      questionnaire.answers.map(answer => 
        questionnaire.options.findIndex(option => option.label === answer.label)
      ).filter(index => index !== -1) : undefined,
    correctAnswerIndex: !questionnaire.allowMultiple && questionnaire.answers?.[0] ? 
      questionnaire.options.findIndex(option => option.label === questionnaire.answers[0].label) : undefined,
  };
};

// Transform form data back to API format for submission
export const transformFormDataToCourse = (formData: CourseFormData): Record<string, unknown> => {
  return {
    title: formData.title,
    coverIcon: formData.coverIcon,
    description: formData.description,
    isPublished: formData.isPublished,
    intro: formData.intro,
    sections: formData.sections.map(transformSectionFormToAPI),
    preTest: {
      questionToBeAnswered: formData.preTest.questionToBeAnswered,
      marksToPass: formData.preTest.marksToPass,
      description: formData.preTest.description,
    },
    finalTest: {
      questionToBeAnswered: formData.finalTest.questionToBeAnswered,
      marksToPass: formData.finalTest.marksToPass,
      description: formData.finalTest.description,
    },
    finalExam: {
      questionToBeAnswered: formData.finalExam.questionToBeAnswered,
      marksToPass: formData.finalExam.marksToPass,
      description: formData.finalExam.description,
    },
  };
};

export const transformSectionFormToAPI = (section: CourseSectionForm): Record<string, unknown> => {
  return {
    title: section.title,
    description: section.description,
    totalChapter: section.totalChapter,
    chapters: section.chapters.map(transformChapterFormToAPI),
  };
};

export const transformChapterFormToAPI = (chapter: CourseChapterForm): Record<string, unknown> => {
  return {
    title: chapter.title,
    description: chapter.description,
    totalSlide: chapter.totalSlide,
    chapterNumber: chapter.chapterNumber,
    activityAt: chapter.activityAt,
    lessonDuration: chapter.lessonDuration,
    isPublished: chapter.isPublished,
    slides: chapter.slides.map(transformSlideFormToAPI),
    midTest: chapter.midTestSlide ? transformSlideFormToTest(chapter.midTestSlide) : null,
  };
};

export const transformSlideFormToAPI = (slide: CourseSlideForm): Record<string, unknown> => {
  return {
    note: slide.note,
    description: slide.description,
    slideNumber: slide.slideNumber,
    file: slide.file,
    isPublished: slide.isPublished,
  };
};

export const transformSlideFormToTest = (slide: CourseSlideForm): Record<string, unknown> => {
  if (!slide.activity) {
    return {
      questionToBeAnswered: 0,
      marksToPass: 0,
      description: slide.description,
      isPublished: slide.isPublished,
      questionnaires: [],
    };
  }

  return {
    questionToBeAnswered: slide.activity.instruction.questionToBeAnswered,
    marksToPass: slide.activity.instruction.marksToPass,
    description: slide.activity.instruction.description,
    isPublished: slide.isPublished,
    questionnaires: slide.activity.questions.map(transformActivityToQuestionnaire),
  };
};

export const transformActivityToQuestionnaire = (question: ActivityQuestion): Record<string, unknown> => {
  return {
    question: question.question,
    questionImage: question.questionImage || "",
    feedbackStatement: question.feedbackStatement || "",
    allowMultiple: question.allowMultiple,
    options: question.options.map(option => ({
      label: option.label || "",
      image: option.image || "",
    })),
    answers: question.allowMultiple 
      ? (question.correctAnswers?.map(index => ({
          label: question.options[index]?.label || "",
          image: question.options[index]?.image || "",
        })) || [])
      : question.correctAnswerIndex !== undefined 
        ? [{
            label: question.options[question.correctAnswerIndex]?.label || "",
            image: question.options[question.correctAnswerIndex]?.image || "",
          }]
        : [],
  };
};
