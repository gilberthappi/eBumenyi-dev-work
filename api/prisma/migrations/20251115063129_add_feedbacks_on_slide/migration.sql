-- CreateTable
CREATE TABLE "FeedbackOnSlide" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackOnSlide_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeedbackOnSlide" ADD CONSTRAINT "FeedbackOnSlide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackOnSlide" ADD CONSTRAINT "FeedbackOnSlide_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
