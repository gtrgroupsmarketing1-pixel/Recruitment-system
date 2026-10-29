"use client";

import { createTaskAction } from "@/modules/task/create.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewTaskDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>+ Add task</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Manual task assigned to you. System tasks are created from pipeline events.
          </DialogDescription>
        </DialogHeader>
        <form action={createTaskAction} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            Title
            <input
              name="title"
              required
              placeholder="e.g. Call candidate about medical"
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Description
            <input
              name="description"
              className="h-8 rounded-lg border border-input bg-background px-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Due date
              <input
                name="dueDate"
                type="date"
                className="h-8 rounded-lg border border-input bg-background px-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Priority
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="h-8 rounded-lg border border-input bg-background px-2"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </label>
          </div>
          <Button type="submit" className="mt-1 w-full sm:w-auto">
            Create task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
