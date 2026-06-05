-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "emailNotif" BOOLEAN NOT NULL DEFAULT true,
    "pushNotif" BOOLEAN NOT NULL DEFAULT true,
    "smsNotif" BOOLEAN NOT NULL DEFAULT false,
    "categories" JSONB NOT NULL DEFAULT '{"courseUpdates":true,"assignmentReminders":true,"certificates":true,"systemUpdates":false}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
