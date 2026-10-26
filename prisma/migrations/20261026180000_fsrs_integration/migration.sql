ALTER TABLE "FsrsState" ADD COLUMN "configRevision" INTEGER;
ALTER TABLE "FsrsState" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "FsrsReview" (
    "reviewEventId" TEXT NOT NULL PRIMARY KEY,
    "lexicalSenseId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewedAt" DATETIME NOT NULL,
    "revlogJson" TEXT NOT NULL,
    "cardJson" TEXT NOT NULL,
    "configRevision" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FsrsReview_lexicalSenseId_fkey" FOREIGN KEY ("lexicalSenseId") REFERENCES "LexicalSense" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "FsrsReview_lexicalSenseId_reviewedAt_idx" ON "FsrsReview"("lexicalSenseId", "reviewedAt");

CREATE TABLE "FsrsConfigRevision" (
    "revision" INTEGER NOT NULL PRIMARY KEY,
    "modelVersion" TEXT NOT NULL,
    "overridesJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
