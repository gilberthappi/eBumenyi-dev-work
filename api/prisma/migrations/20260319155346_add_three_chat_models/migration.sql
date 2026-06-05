/*
  Warnings:

  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversation_participants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_reads` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "comments";

-- DropTable
DROP TABLE "conversation_participants";

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "message_likes";

-- DropTable
DROP TABLE "message_reads";

-- DropTable
DROP TABLE "messages";

-- DropEnum
DROP TYPE "ConversationType";

-- DropEnum
DROP TYPE "MessageType";

-- CreateTable
CREATE TABLE "direct_chats" (
    "id" TEXT NOT NULL,
    "userId1" TEXT NOT NULL,
    "userId2" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direct_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "attachments" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_message_reads" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_message_likes" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_message_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_chats" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT DEFAULT 'https://res.cloudinary.com/dleiqpvue/image/upload/v1759124054/rbc-removebg-preview_k8xhjr.png',
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_chat_participants" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_chat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_messages" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "attachments" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_message_reads" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_message_likes" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_message_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_comments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "parentId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photo" TEXT DEFAULT 'https://res.cloudinary.com/dleiqpvue/image/upload/v1759124054/rbc-removebg-preview_k8xhjr.png',
    "createdById" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_members" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "photo" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "parentId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "direct_chats_userId1_idx" ON "direct_chats"("userId1");

-- CreateIndex
CREATE INDEX "direct_chats_userId2_idx" ON "direct_chats"("userId2");

-- CreateIndex
CREATE INDEX "direct_chats_updatedAt_idx" ON "direct_chats"("updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "direct_chats_userId1_userId2_key" ON "direct_chats"("userId1", "userId2");

-- CreateIndex
CREATE INDEX "direct_messages_chatId_timestamp_idx" ON "direct_messages"("chatId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "direct_messages_senderId_idx" ON "direct_messages"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "direct_message_reads_messageId_userId_key" ON "direct_message_reads"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "direct_message_likes_messageId_userId_key" ON "direct_message_likes"("messageId", "userId");

-- CreateIndex
CREATE INDEX "group_chats_createdById_idx" ON "group_chats"("createdById");

-- CreateIndex
CREATE INDEX "group_chats_updatedAt_idx" ON "group_chats"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "group_chat_participants_userId_idx" ON "group_chat_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_chat_participants_groupId_userId_key" ON "group_chat_participants"("groupId", "userId");

-- CreateIndex
CREATE INDEX "group_messages_groupId_timestamp_idx" ON "group_messages"("groupId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "group_messages_senderId_idx" ON "group_messages"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "group_message_reads_messageId_userId_key" ON "group_message_reads"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_message_likes_messageId_userId_key" ON "group_message_likes"("messageId", "userId");

-- CreateIndex
CREATE INDEX "group_comments_messageId_timestamp_idx" ON "group_comments"("messageId", "timestamp");

-- CreateIndex
CREATE INDEX "group_comments_parentId_idx" ON "group_comments"("parentId");

-- CreateIndex
CREATE INDEX "communities_createdById_idx" ON "communities"("createdById");

-- CreateIndex
CREATE INDEX "communities_isPublic_idx" ON "communities"("isPublic");

-- CreateIndex
CREATE INDEX "communities_updatedAt_idx" ON "communities"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "community_members_userId_idx" ON "community_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_communityId_userId_key" ON "community_members"("communityId", "userId");

-- CreateIndex
CREATE INDEX "community_posts_communityId_timestamp_idx" ON "community_posts"("communityId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "community_posts_authorId_idx" ON "community_posts"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "community_post_likes_postId_userId_key" ON "community_post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "community_post_comments_postId_timestamp_idx" ON "community_post_comments"("postId", "timestamp");

-- CreateIndex
CREATE INDEX "community_post_comments_parentId_idx" ON "community_post_comments"("parentId");
