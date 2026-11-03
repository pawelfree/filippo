CREATE TABLE "ClozeExerciseUsage" (
    "exerciseId" TEXT NOT NULL PRIMARY KEY,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClozeExerciseUsage_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "ClozeExercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "ClozeExerciseUsage" ("exerciseId", "usedAt")
SELECT "exerciseId", MIN("reviewedAt") FROM "ClozeAttempt" GROUP BY "exerciseId";
