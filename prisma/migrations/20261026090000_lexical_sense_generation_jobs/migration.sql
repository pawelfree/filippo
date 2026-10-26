CREATE TABLE "LexicalSenseGenerationJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "status" TEXT NOT NULL,
  "itemsJson" TEXT NOT NULL,
  "resultJson" TEXT,
  "validationJson" TEXT,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" DATETIME,
  "completedAt" DATETIME
);
CREATE INDEX "LexicalSenseGenerationJob_status_createdAt_idx" ON "LexicalSenseGenerationJob"("status", "createdAt");
CREATE TABLE "LexicalSenseGenerationProposal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "senseJson" TEXT NOT NULL,
  "validationWarningsJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LexicalSenseGenerationProposal_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "LexicalSenseGenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LexicalSenseGenerationProposal_jobId_idx" ON "LexicalSenseGenerationProposal"("jobId");
CREATE TABLE "RejectedLexicalSenseProposal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceProposalId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "senseJson" TEXT NOT NULL,
  "validationWarningsJson" TEXT,
  "rejectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RejectedLexicalSenseProposal_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "LexicalSenseGenerationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RejectedLexicalSenseProposal_sourceProposalId_key" ON "RejectedLexicalSenseProposal"("sourceProposalId");
CREATE INDEX "RejectedLexicalSenseProposal_jobId_idx" ON "RejectedLexicalSenseProposal"("jobId");
