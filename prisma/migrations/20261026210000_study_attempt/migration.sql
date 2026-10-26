CREATE TABLE "StudyAttempt" (
    "eventId" TEXT NOT NULL PRIMARY KEY,
    "lexicalSenseId" TEXT NOT NULL,
    "presentationToken" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewedAt" DATETIME NOT NULL,
    "dayKey" TEXT NOT NULL,
    "fsrsReviewEventId" TEXT,
    CONSTRAINT "StudyAttempt_lexicalSenseId_fkey" FOREIGN KEY ("lexicalSenseId") REFERENCES "LexicalSense" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudyAttempt_fsrsReviewEventId_fkey" FOREIGN KEY ("fsrsReviewEventId") REFERENCES "FsrsReview" ("reviewEventId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StudyAttempt_fsrsReviewEventId_key" ON "StudyAttempt"("fsrsReviewEventId");
CREATE INDEX "StudyAttempt_dayKey_lexicalSenseId_reviewedAt_idx" ON "StudyAttempt"("dayKey", "lexicalSenseId", "reviewedAt");
