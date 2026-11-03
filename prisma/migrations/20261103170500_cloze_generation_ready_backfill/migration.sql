UPDATE "ClozeSession"
SET "generationProcessed" = json_array_length("selectedIdsJson")
WHERE "status" = 'ready' AND "generationProcessed" IS NULL;
