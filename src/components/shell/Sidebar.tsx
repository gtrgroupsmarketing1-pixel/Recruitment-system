"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

/** Core recruiter loop — keep this short. */
const OPERATE: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/requisitions", label: "Requisitions" },
  { href: "/candidates", label: "Candidates" },
  { href: "/tasks", label: "Tasks" },
  { href: "/documents", label: "Documents" },
];

/** Agency ops — clients, staff, client portal inbox, email + branding. */
const ADMIN: NavItem[] = [
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/users", label: "Staff users" },
  { href: "/admin/job-orders", label: "Job orders" },
  { href: "/admin/email-config", label: "Email sender" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/integrations", label: "Integrations" },
];

/**
 * Hidden from normal nav (still reachable by URL):
 * /compliance, /compliance/templates
 * /admin/connectors, /admin/sms, /admin/jobs, /admin/notifications
 * /settings/calendar
 */
const SYSTEM: NavItem[] = [
  { href: "/admin/jobs", label: "Job runs" },
  { href: "/admin/notifications", label: "Delivery log" },
];

type Props = { role?: string | null };

export function Sidebar({ role }: Props) {
  const pathname = usePathname();
  const showSystem = role === "TENANT_ADMIN" || role === "PLATFORM_ADMIN";

  const groups: { label: string; items: NavItem[] }[] = [
    { label: "Operate", items: OPERATE },
    { label: "Admin", items: ADMIN },
  ];
  if (showSystem) {
    groups.push({ label: "System", items: SYSTEM });
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Recruitment OS
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
