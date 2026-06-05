import * as z from "zod";

// Trainee Certificate Schema
export const traineeCertificateSchema = z.object({
  traineeId: z.string().min(1, "Trainee ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
  score: z.number().min(0).max(100, "Score must be between 0 and 100"),
  certificateNumber: z.string().min(1, "Certificate number is required"),
  duration: z.string().min(1, "Duration is required"),
  skills: z.array(z.string()).default([]),
});

export type TraineeCertificateInput = z.infer<typeof traineeCertificateSchema>;

// Certificate Template Design Schema
const certificateTemplateSchema = z.object({
  title: z.string().min(1, "Certificate title is required"),
  description: z.string().optional(),
  backgroundImage: z.string().optional(),
  customDesign: z
    .object({
      layout: z.enum(["standard", "modern", "classic"]),
      colors: z.object({
        primary: z.string(),
        secondary: z.string(),
        text: z.string(),
      }),
      fonts: z.object({
        title: z.string(),
        body: z.string(),
      }),
    })
    .optional(),
  seals: z.array(z.string()).optional(),
  signatures: z
    .array(
      z.object({
        name: z.string(),
        title: z.string(),
        imageUrl: z.string().optional(),
      })
    )
    .optional(),
});

// Workshop Certificate Schema
export const workshopCertificateSchema = z.object({
  workshopName: z.string().min(1, "Workshop name is required"),
  template: certificateTemplateSchema,
  duration: z.string().min(1, "Duration is required"),
  skillsAcquired: z.array(z.string()).min(1, "At least one skill is required"),
  isPublic: z.boolean().default(false),
  expiryPolicy: z
    .object({
      hasExpiry: z.boolean(),
      expiryDays: z.number().optional(),
    })
    .optional(),
});

export type WorkshopCertificateInput = z.infer<typeof workshopCertificateSchema>;

// Participant Issue Schema
export const issueCertificateSchema = z.object({
  participantIds: z.array(z.string()).min(1, "At least one participant is required"),
  expiryDays: z.number().optional(),
});

export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;

// Update Workshop Certificate Schema
export const updateWorkshopCertificateSchema = z.object({
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
  template: certificateTemplateSchema.optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateWorkshopCertificateInput = z.infer<
  typeof updateWorkshopCertificateSchema
>;
