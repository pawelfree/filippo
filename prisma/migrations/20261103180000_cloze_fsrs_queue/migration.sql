ALTER TABLE "ClozeExercise" ADD COLUMN "batch" INTEGER NOT NULL DEFAULT 1;
DROP INDEX "ClozeExercise_lexicalSenseId_position_key";
CREATE UNIQUE INDEX "ClozeExercise_lexicalSenseId_batch_position_key" ON "ClozeExercise"("lexicalSenseId", "batch", "position");
ALTER TABLE "ClozeSession" ADD COLUMN "selectedKindsJson" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "ClozeSession" ADD COLUMN "exerciseIdsJson" TEXT NOT NULL DEFAULT '{}';
