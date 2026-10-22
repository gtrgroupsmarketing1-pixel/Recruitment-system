import type { ReactNode } from "react";

type Props = {
  message?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ message, title, description, action }: Props) {
  const heading = title || message || "Nothing here";
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded border border-dashed p-6 text-center">
      <p className="text-base font-medium">{heading}</p>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
