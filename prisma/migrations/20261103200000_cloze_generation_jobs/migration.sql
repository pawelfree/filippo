ALTER TABLE "ClozeSession" ADD COLUMN "generationRequested" BOOLEAN NOT NULL DEFAULT false;

-- Older queued, running and failed sessions were created only when exercises were missing.
-- For completed sessions, an assigned exercise created after the session or a recorded
-- generation failure is evidence that the generation worker ran.
UPDATE "ClozeSession"
SET "generationRequested" = true
WHERE "status" IN ('queued', 'running', 'failed')
   OR "failuresJson" <> '{}'
   OR EXISTS (
     SELECT 1
     FROM json_each("ClozeSession"."exerciseIdsJson") AS assigned
     JOIN "ClozeExercise" AS exercise ON exercise."id" = assigned."value"
     WHERE exercise."createdAt" > "ClozeSession"."createdAt"
   );
