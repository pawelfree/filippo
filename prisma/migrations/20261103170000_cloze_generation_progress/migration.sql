ALTER TABLE "ClozeSession" ADD COLUMN "generationProcessed" INTEGER;
UPDATE "ClozeSession" SET "generationProcessed" = 0 WHERE "status" = 'queued';
