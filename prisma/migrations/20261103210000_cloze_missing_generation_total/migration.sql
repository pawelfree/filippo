ALTER TABLE "ClozeSession" ADD COLUMN "generationTotal" INTEGER NOT NULL DEFAULT 0;

-- Earlier versions counted every selected meaning, including those already supplied
-- from the exercise pool. Recover the number missing at session creation where possible.
UPDATE "ClozeSession"
SET "generationTotal" = (
  SELECT COUNT(*) FROM json_each("ClozeSession"."selectedIdsJson") AS selected
  WHERE NOT EXISTS (
    SELECT 1 FROM "ClozeExercise" AS exercise
    WHERE exercise."lexicalSenseId" = selected."value"
      AND exercise."createdAt" <= "ClozeSession"."createdAt"
  )
)
WHERE "generationRequested" = true;

UPDATE "ClozeSession"
SET "generationProcessed" = MAX(0, "generationProcessed" - (json_array_length("selectedIdsJson") - "generationTotal"))
WHERE "generationRequested" = true AND "generationProcessed" IS NOT NULL;
