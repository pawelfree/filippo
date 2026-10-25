CREATE TABLE "OpenAiGenerationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resultJson" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "validationJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "OpenAiGenerationResult_createdAt_idx" ON "OpenAiGenerationResult"("createdAt");
