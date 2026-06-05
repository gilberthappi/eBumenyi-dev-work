import { z } from 'zod';

export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').default(''),
  coverIcon: z.string().default(''), // Will be handled as binary file
  description: z.string().default(''),
  isPublished: z.boolean().default(false),
});

export const sectionSchema = z.object({
  title: z.string().min(1, 'Title is required').default(''),
  description: z.string().default(''),
});

export const chapterSchema = z.object({
  title: z.string().min(1, 'Title is required').default(''),
  description: z.string().default(''),
  type: z.string().default(''),
  chapterNumber: z.number().default(1),
  activityAt: z.number().default(0),
  lessonDuration: z.number().default(0),
  isPublished: z.boolean().default(true),
});

export const slideSchema = z.object({
  note: z.string().default(''),
  description: z.string().default(''),
  type: z.string().default(''),
  slideNumber: z.number().min(1, 'Slide number is required').default(1),
  file: z.string().default(''), // Will be handled as binary file
  isPublished: z.boolean().default(true),
  isActivitySlide: z.boolean().default(false),
  isPreTestSlide: z.boolean().default(false),
  isFinalTestSlide: z.boolean().default(false),
});

export const courseIntroSchema = z.object({
  title: z.string().min(1, 'Title is required').default(''),
  summary: z.string().min(1, 'Summary is required').default(''),
  bannerImage: z.string().default(''), // Will be handled as binary file
  thumbnail: z.string().default(''), // Will be handled as binary file
});

export const activityInstructionSchema = z.object({
  questionToBeAnswered: z.number().min(0, 'Must be 0 or greater').default(0),
  marksToPass: z.number().min(0, 'Must be 0 or greater').default(0),
  description: z.string().default(''),
});

export const optionSchema = z.object({
  label: z.string().min(1, 'Label is required').default(''),
  image: z.string().default(''), // Will be handled as binary file
});

export const answerSchema = z.object({
  label: z.string().default(''),
  image: z.string().default(''), // Will be handled as binary file
});

export const questionnaireSchema = z.object({
  question: z.string().min(1, 'Question is required').default(''),
  questionImage: z.string().default(''), 
  feedbackStatement: z.string().default(''),
  allowMultiple: z.boolean().default(false),
  options: z.array(optionSchema).default([]),
  correctAnswer: answerSchema.default({ label: '', image: '' }),
  correctAnswers: z.array(z.number()).default([]),
  correctAnswerIndex: z.number().optional(),
});

export const activitySchema = z.object({
  instruction: activityInstructionSchema,
  questions: z.array(questionnaireSchema).default([]),
});

// Complete slide schema with activity support
export const completeSlideSchema = slideSchema.extend({
  activity: activitySchema.optional(),
});

// Complete chapter schema with slides and final test
export const completeChapterSchema = chapterSchema.extend({
  slides: z.array(completeSlideSchema).default([]),
  finalTestSlide: completeSlideSchema.optional(),
});

// Complete section schema with chapters and pre-test
export const completeSectionSchema = sectionSchema.extend({
  chapters: z.array(completeChapterSchema).default([]),
  preTestSlide: completeSlideSchema.optional(),
});

// Complete course payload schema
export const coursePayloadSchema = z.object({
  course: courseSchema,
  courseIntro: courseIntroSchema,
  sections: z.array(completeSectionSchema).default([]),
});
