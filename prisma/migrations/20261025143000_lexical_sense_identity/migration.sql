ALTER TABLE "LexicalSense" ADD COLUMN "identityKey" TEXT;
CREATE UNIQUE INDEX "LexicalSense_identityKey_key" ON "LexicalSense"("identityKey");
