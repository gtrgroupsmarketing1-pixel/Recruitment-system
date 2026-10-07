import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
import { ComplianceTemplateService } from "./compliance.template.service";
import { ComplianceCaseService } from "./compliance.case.service";

const stepInput = z
  .object({
    stepOrder: z.number().int().positive(),
    name: z.string().min(1),
    responsibleParty: z.string().min(1),
    requiredDocuments: z.array(z.string()),
    slaDays: z.number().int().nonnegative(),
    dependsOnStepOrder: z.number().int().positive().nullable(),
    connectorId: z.string().nullable(),
  })
  .strict();

export const complianceRouter = router({
  templates: router({
    list: protectedProcedure
      .input(
        z
          .object({
            active: z.boolean().optional(),
            originCountry: z.string().optional(),
            destinationCountry: z.string().optional(),
            roleCategory: z.string().optional(),
          })
          .strict()
      )
      .query(({ ctx, input }) =>
        ComplianceTemplateService.listTemplates(ctx.tenantId, input)
      ),
    get: protectedProcedure
      .input(z.object({ id: z.string() }).strict())
      .query(({ ctx, input }) =>
        ComplianceTemplateService.getTemplate(ctx.tenantId, input.id)
      ),
    create: protectedProcedure
      .input(
        z
          .object({
            name: z.string().min(1),
            originCountry: z.string().length(2),
            destinationCountry: z.string().length(2),
            roleCategory: z.string().min(1),
            isActive: z.boolean().optional(),
            steps: z.array(stepInput),
          })
          .strict()
      )
      .mutation(({ ctx, input }) =>
        ComplianceTemplateService.createTemplate(ctx.tenantId, ctx.userId, input)
      ),
    update: protectedProcedure
      .input(
        z
          .object({
            id: z.string(),
            name: z.string().optional(),
            originCountry: z.string().optional(),
            destinationCountry: z.string().optional(),
            roleCategory: z.string().optional(),
            isActive: z.boolean().optional(),
          })
          .strict()
      )
      .mutation(({ ctx, input }) => {
        const { id, ...rest } = input;
        return ComplianceTemplateService.updateTemplate(
          ctx.tenantId,
          ctx.userId,
          id,
          rest
        );
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }).strict())
      .mutation(({ ctx, input }) =>
        ComplianceTemplateService.deleteTemplate(ctx.tenantId, ctx.userId, input.id)
      ),
  }),
  steps: router({
    add: protectedProcedure
      .input(stepInput.extend({ templateId: z.string() }))
      .mutation(({ ctx, input }) => {
        const { templateId, ...step } = input;
        return ComplianceTemplateService.addStep(
          ctx.tenantId,
          ctx.userId,
          templateId,
          step
        );
      }),
    update: protectedProcedure
      .input(stepInput.partial().extend({ stepId: z.string() }))
      .mutation(({ ctx, input }) => {
        const { stepId, ...rest } = input;
        return ComplianceTemplateService.updateStep(
          ctx.tenantId,
          ctx.userId,
          stepId,
          rest
        );
      }),
    remove: protectedProcedure
      .input(z.object({ stepId: z.string(), force: z.boolean().default(false) }).strict())
      .mutation(({ ctx, input }) =>
        ComplianceTemplateService.removeStep(
          ctx.tenantId,
          ctx.userId,
          input.stepId,
          input.force
        )
      ),
  }),
  cases: router({
    list: protectedProcedure
      .input(
        z
          .object({
            status: z.string().optional(),
            requisitionId: z.string().optional(),
          })
          .strict()
      )
      .query(({ ctx, input }) =>
        ComplianceCaseService.listCases(ctx.tenantId, input)
      ),
    get: protectedProcedure
      .input(z.object({ id: z.string() }).strict())
      .query(({ ctx, input }) =>
        ComplianceCaseService.getCase(ctx.tenantId, input.id)
      ),
    completeStep: protectedProcedure
      .input(
        z
          .object({
            caseId: z.string(),
            checklistId: z.string(),
            docs: z.array(z.string()).default([]),
          })
          .strict()
      )
      .mutation(({ ctx, input }) =>
        ComplianceCaseService.completeStep(
          ctx.tenantId,
          ctx.userId,
          input.caseId,
          input.checklistId,
          input.docs
        )
      ),
    uncompleteStep: protectedProcedure
      .input(z.object({ caseId: z.string(), checklistId: z.string() }).strict())
      .mutation(({ ctx, input }) =>
        ComplianceCaseService.uncompleteStep(
          ctx.tenantId,
          ctx.userId,
          input.caseId,
          input.checklistId
        )
      ),
  }),
});
