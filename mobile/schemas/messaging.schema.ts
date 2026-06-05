import * as z from "zod";

// Create Conversation Schema
export const createConversationSchema = z.object({
  type: z.enum(["direct", "group", "community"]),
  name: z.string().optional(),
  isPublic: z.boolean().default(false),
  participantIds: z.array(z.string()).min(1, "At least one participant is required"),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

// Send Message Schema
export const sendMessageSchema = z.object({
  type: z.enum(["text", "image", "video", "audio", "file", "blog"]),
  content: z.string().optional(),
  title: z.string().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["image", "video", "audio", "file"]),
      })
    )
    .optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// Edit Message Schema
export const editMessageSchema = z.object({
  content: z.string().optional(),
  title: z.string().optional(),
});

export type EditMessageInput = z.infer<typeof editMessageSchema>;

// Add Comment Schema
export const addCommentSchema = z.object({
  text: z.string().min(1, "Comment text is required"),
  parentId: z.string().optional(),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;

// Add Participant Schema
export const addParticipantSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type AddParticipantInput = z.infer<typeof addParticipantSchema>;

// Update Conversation Schema
export const updateConversationSchema = z.object({
  name: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

// Search Messages Schema
export const searchMessagesSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  conversationId: z.string().optional(),
  limit: z.number().max(100).default(20),
  offset: z.number().default(0),
});

export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;
