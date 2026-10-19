import Link from "next/link";
import { createRequisitionAction } from "../create.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Client = { id: string; name: string; code: string };

export function CreateRequisitionForm({ clients }: { clients: Client[] }) {
  return (
    <form action={createRequisitionAction} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="clientCompanyId">Client company</Label>
          <Link href="/admin/clients/new" className="text-sm text-blue-600 hover:underline">
            + Add new client
          </Link>
        </div>
        <select
          id="clientCompanyId"
          name="clientCompanyId"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="">Select a client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country (ISO)</Label>
        <Input id="country" name="country" defaultValue="AE" required maxLength={2} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleCategory">Role category</Label>
        <Input id="roleCategory" name="roleCategory" defaultValue="BC" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vacancyTarget">Vacancy target</Label>
        <Input id="vacancyTarget" name="vacancyTarget" type="number" required min={1} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetOnboardingDate">Target onboarding</Label>
        <Input id="targetOnboardingDate" name="targetOnboardingDate" type="date" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" />
      </div>

      <Button type="submit" className="w-full">Create requisition</Button>
    </form>
  );
}