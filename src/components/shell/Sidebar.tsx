"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operate",
    items: [
      { href: "/", label: "Home" },
      { href: "/requisitions", label: "Requisitions" },
      { href: "/candidates", label: "Candidates" },
      { href: "/tasks", label: "Tasks" },
      { href: "/documents", label: "Documents" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/compliance", label: "Dashboard" },
      { href: "/compliance/templates", label: "Templates" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/clients", label: "Clients" },
      { href: "/admin/job-orders", label: "Job orders" },
      { href: "/admin/notifications", label: "Notifications" },
      { href: "/admin/integrations", label: "Integrations" },
      { href: "/admin/connectors", label: "Connectors" },
      { href: "/admin/email-config", label: "Email" },
      { href: "/admin/sms", label: "SMS" },
      { href: "/admin/jobs", label: "Jobs" },
      { href: "/admin/branding", label: "Branding" },
      { href: "/settings/calendar", label: "Calendar" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Recruitment OS
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
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
