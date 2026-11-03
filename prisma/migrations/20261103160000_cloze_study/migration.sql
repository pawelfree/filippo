CREATE TABLE "ClozeExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lexicalSenseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "contentJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClozeExercise_lexicalSenseId_fkey" FOREIGN KEY ("lexicalSenseId") REFERENCES "LexicalSense" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ClozeExercise_lexicalSenseId_position_key" ON "ClozeExercise"("lexicalSenseId", "position");

CREATE TABLE "ClozeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "selectedIdsJson" TEXT NOT NULL,
    "failuresJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "cursor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "ClozeSession_status_createdAt_idx" ON "ClozeSession"("status", "createdAt");

CREATE TABLE "ClozeAttempt" (
    "eventId" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "lexicalSenseId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "responseJson" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewedAt" DATETIME NOT NULL,
    CONSTRAINT "ClozeAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClozeSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClozeAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "ClozeExercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ClozeAttempt_sessionId_position_key" ON "ClozeAttempt"("sessionId", "position");
CREATE INDEX "ClozeAttempt_lexicalSenseId_reviewedAt_idx" ON "ClozeAttempt"("lexicalSenseId", "reviewedAt");
