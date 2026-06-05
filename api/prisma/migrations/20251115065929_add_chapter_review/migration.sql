-- CreateTable
CREATE TABLE "ChapterReview" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "reviewCriteria" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChapterReview" ADD CONSTRAINT "ChapterReview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterReview" ADD CONSTRAINT "ChapterReview_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
