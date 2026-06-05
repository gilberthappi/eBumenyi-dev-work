export interface Course {
  id: string;
  creatorId: string;
  title: string;
  coverIcon: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  staff: Staff;
  sections: Section[];
  intro: CourseIntro;
}

export interface Staff {
  id: string;
  userId: string;
  role: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  password: string;
  fullNames: string;
  phoneNumber: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  NID: string | null;
  gender: string | null;
  birthdate: string | null;
  createdAt: string;
  updatedAt: string;
  otp: string | null;
  otpExpiresAt: string | null;
  photo: string;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  description: string;
  totalChapter: number;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  preTests: Test[];
}

export interface Chapter {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  totalSlide: number;
  activityAt: number;
  type: string;
  chapterNumber: number;
  lessonDuration: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
  midTest: Test | null;
  finalTest: Test | null;
}

export interface Slide {
  id: string;
  chapterId: string;
  note: string;
  description: string;
  type: 'document' | 'image' | 'video' | 'text';
  slideNumber: number;
  file: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Test {
  id: string;
  chapterId?: string;
  courseId?: string;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
  questionnaires: Questionnaire[];
}

export interface Questionnaire {
  id: string;
  question: string;
  questionImage: string;
  feedbackStatement: string;
  allowMultiple: boolean;
  preTestId: string | null;
  midTestId: string | null;
  finalTestId: string | null;
  createdAt: string;
  updatedAt: string;
  answers: Answer[];
  options: Option[];
}

export interface Answer {
  id: string;
  label: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  questionnaireId: string;
}

export interface Option {
  id: string;
  label: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  questionnaireId: string;
}

export interface CourseIntro {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  bannerImage: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  courseId: string;
  currentLocation?: {
    type: string;
    id: string;
  };
  completedSections: string[];
  chapterProgress: Record<string, ChapterProgress>;
  updatedAt: string;
}

export interface ChapterProgress {
  currentSlide: number;
  completedTests: string[];
  viewMode: string;
  completed: boolean;
}