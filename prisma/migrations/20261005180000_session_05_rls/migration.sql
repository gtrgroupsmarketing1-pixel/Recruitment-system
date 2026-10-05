-- Session 05: Row Level Security on tenant-scoped tables.
-- Account / Session / VerificationToken intentionally excluded (Auth.js pre-tenant).

ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientCompany" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Candidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobRequisition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScreeningRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceCase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChecklistInstance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalClearance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttestationChain" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttestationStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LaborExitClearance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkPermitVisa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TravelRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeploymentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DomainEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Tenant table: id IS the tenant identity
CREATE POLICY tenant_self ON "Tenant"
  USING (id = current_setting('app.tenant_id', true))
  WITH CHECK (id = current_setting('app.tenant_id', true));

-- All other tenant-scoped tables filter on tenant_id
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'User','Branch','ClientCompany','Candidate','JobRequisition',
      'CandidateApplication','ScreeningRecord','ComplianceCase',
      'ChecklistInstance','MedicalClearance','AttestationChain',
      'AttestationStep','LaborExitClearance','WorkPermitVisa',
      'TravelRecord','DeploymentRecord','DomainEvent','AuditLog'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (tenant_id = current_setting(''app.tenant_id'', true))
         WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t
    );
  END LOOP;
END $$;
