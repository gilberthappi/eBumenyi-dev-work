-- DropForeignKey
ALTER TABLE "CHOGroup" DROP CONSTRAINT "CHOGroup_choId_fkey";

-- DropForeignKey
ALTER TABLE "CHOGroupInvitation" DROP CONSTRAINT "CHOGroupInvitation_groupId_fkey";

-- DropForeignKey
ALTER TABLE "CHOGroupInvitation" DROP CONSTRAINT "CHOGroupInvitation_studentId_fkey";

-- DropForeignKey
ALTER TABLE "CHOGroupMember" DROP CONSTRAINT "CHOGroupMember_groupId_fkey";

-- DropForeignKey
ALTER TABLE "CHOGroupMember" DROP CONSTRAINT "CHOGroupMember_studentId_fkey";
