type Props = {
  className?: string;
  children: React.ReactNode;
};

export function Badge({ className, children }: Props) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
