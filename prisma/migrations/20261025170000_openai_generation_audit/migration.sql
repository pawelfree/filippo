CREATE TABLE "OpenAiGenerationAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inputJson" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "responseJson" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "validationJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "OpenAiGenerationAttempt_createdAt_idx" ON "OpenAiGenerationAttempt"("createdAt");
