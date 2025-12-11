-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "memory" INTEGER DEFAULT 0,
ADD COLUMN     "testCasesPassed" INTEGER DEFAULT 0,
ADD COLUMN     "time" INTEGER DEFAULT 0;
