"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

export function QuickActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/requisitions/new"
        className={cn(buttonVariants({ variant: "default" }))}
      >
        New requisition
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Quick add
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            onClick={() => {
              window.location.href = "/candidates/new";
            }}
          >
            Add candidate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              window.location.href = "/candidates/bulk";
            }}
          >
            Bulk / upload CVs
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              window.location.href = "/admin/clients/new";
            }}
          >
            Add client
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
