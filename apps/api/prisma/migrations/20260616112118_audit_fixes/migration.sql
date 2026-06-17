-- CreateIndex
CREATE INDEX "deals_creatorId_stage_idx" ON "deals"("creatorId", "stage");

-- CreateIndex
CREATE INDEX "invoices_creatorId_status_idx" ON "invoices"("creatorId", "status");

-- CreateIndex
CREATE INDEX "performance_logs_creatorId_recordedAt_idx" ON "performance_logs"("creatorId", "recordedAt");
