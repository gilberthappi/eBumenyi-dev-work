-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN     "reshareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resharedFromId" TEXT,
ADD COLUMN     "saveCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "saved_community_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_community_posts_userId_postId_key" ON "saved_community_posts"("userId", "postId");
