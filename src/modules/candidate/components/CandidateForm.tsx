import { createCandidateAction } from "../create.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CandidateForm() {
  return (
    <form action={createCandidateAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passportNumber">Passport number</Label>
        <Input id="passportNumber" name="passportNumber" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nationalId">National ID</Label>
        <Input id="nationalId" name="nationalId" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="smsOptIn" name="smsOptIn" className="h-4 w-4 rounded border-gray-300" />
        <Label htmlFor="smsOptIn">Candidate consents to SMS notifications</Label>
      </div>

      <Button type="submit" className="w-full">Create candidate</Button>
    </form>
  );
}