-- AlterTable
ALTER TABLE "AttempTest" ADD COLUMN     "finalExamId" TEXT;

-- CreateTable
CREATE TABLE "FinalExam" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionToBeAnswered" INTEGER NOT NULL DEFAULT 1,
    "marksToPass" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "FinalExam_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FinalExam" ADD CONSTRAINT "FinalExam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttempTest" ADD CONSTRAINT "AttempTest_finalExamId_fkey" FOREIGN KEY ("finalExamId") REFERENCES "FinalExam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
