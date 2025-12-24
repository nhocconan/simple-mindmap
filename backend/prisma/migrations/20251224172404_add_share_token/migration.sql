-- AlterTable
ALTER TABLE "mindmaps" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mindmaps_shareToken_key" ON "mindmaps"("shareToken");

-- CreateIndex
CREATE INDEX "mindmaps_shareToken_idx" ON "mindmaps"("shareToken");
