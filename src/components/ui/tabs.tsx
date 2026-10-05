type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  children: React.ReactNode;
};

/** Conditional render only. No Radix. */
export function Tabs({ tabs, active, children }: Props) {
  return (
    <div>
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <span
            key={tab.id}
            className={
              tab.id === active
                ? "border-b-2 border-black px-3 py-2 text-sm"
                : "px-3 py-2 text-sm text-neutral-500"
            }
          >
            {tab.label}
          </span>
        ))}
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}
