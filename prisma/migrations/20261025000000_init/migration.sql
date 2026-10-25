-- CreateTable
CREATE TABLE "LexicalSense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL DEFAULT 'it',
    "lexicalItem" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "detailsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GeneratedTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lexicalSenseId" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedTask_lexicalSenseId_fkey" FOREIGN KEY ("lexicalSenseId") REFERENCES "LexicalSense" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FsrsState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "learnerId" TEXT NOT NULL,
    "lexicalSenseId" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "stability" REAL NOT NULL DEFAULT 0,
    "difficulty" REAL NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL DEFAULT 'new',
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "lastReviewAt" DATETIME,
    "schedulerData" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FsrsState_lexicalSenseId_fkey" FOREIGN KEY ("lexicalSenseId") REFERENCES "LexicalSense" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "learnerId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseJson" TEXT,
    "fsrsBeforeJson" TEXT,
    "fsrsAfterJson" TEXT,
    CONSTRAINT "Review_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "GeneratedTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LexicalSense_lexicalItem_idx" ON "LexicalSense"("lexicalItem");

-- CreateIndex
CREATE INDEX "GeneratedTask_lexicalSenseId_createdAt_idx" ON "GeneratedTask"("lexicalSenseId", "createdAt");

-- CreateIndex
CREATE INDEX "FsrsState_learnerId_dueAt_idx" ON "FsrsState"("learnerId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "FsrsState_learnerId_lexicalSenseId_key" ON "FsrsState"("learnerId", "lexicalSenseId");

-- CreateIndex
CREATE INDEX "Review_learnerId_reviewedAt_idx" ON "Review"("learnerId", "reviewedAt");

-- CreateIndex
CREATE INDEX "Review_taskId_reviewedAt_idx" ON "Review"("taskId", "reviewedAt");

