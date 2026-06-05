-- Rename SUPERVISOR enum value to CHO in RoleType
ALTER TYPE "RoleType" RENAME VALUE 'SUPERVISOR' TO 'CHO';

-- Create InvitationStatus enum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable CHOGroup
CREATE TABLE "CHOGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "choId" TEXT NOT NULL,
    "sector" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CHOGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable CHOGroupMember
CREATE TABLE "CHOGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CHOGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable CHOGroupInvitation
CREATE TABLE "CHOGroupInvitation" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "CHOGroupInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CHOGroup_choId_key" ON "CHOGroup"("choId");

-- CreateIndex
CREATE UNIQUE INDEX "CHOGroupMember_studentId_key" ON "CHOGroupMember"("studentId");

-- CreateIndex
CREATE INDEX "CHOGroupMember_groupId_idx" ON "CHOGroupMember"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "CHOGroupInvitation_groupId_studentId_key" ON "CHOGroupInvitation"("groupId", "studentId");

-- CreateIndex
CREATE INDEX "CHOGroupInvitation_studentId_idx" ON "CHOGroupInvitation"("studentId");

-- AddForeignKey
ALTER TABLE "CHOGroup" ADD CONSTRAINT "CHOGroup_choId_fkey" FOREIGN KEY ("choId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHOGroupMember" ADD CONSTRAINT "CHOGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CHOGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHOGroupMember" ADD CONSTRAINT "CHOGroupMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHOGroupInvitation" ADD CONSTRAINT "CHOGroupInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CHOGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHOGroupInvitation" ADD CONSTRAINT "CHOGroupInvitation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
