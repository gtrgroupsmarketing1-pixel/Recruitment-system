-- CreateTable
CREATE TABLE "WhatsAppLead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "profileName" TEXT,
    "lastMessage" TEXT,
    "adId" TEXT,
    "ctwaClid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "candidateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppLead_candidateId_key" ON "WhatsAppLead"("candidateId");

-- CreateIndex
CREATE INDEX "WhatsAppLead_tenantId_status_idx" ON "WhatsAppLead"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WhatsAppLead_tenantId_phoneNumber_idx" ON "WhatsAppLead"("tenantId", "phoneNumber");

-- CreateIndex
CREATE INDEX "WhatsAppLead_tenantId_createdAt_idx" ON "WhatsAppLead"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "WhatsAppLead" ADD CONSTRAINT "WhatsAppLead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppLead" ADD CONSTRAINT "WhatsAppLead_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
