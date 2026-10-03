-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "bringList" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "included" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "schedule" TEXT[] DEFAULT ARRAY[]::TEXT[];
