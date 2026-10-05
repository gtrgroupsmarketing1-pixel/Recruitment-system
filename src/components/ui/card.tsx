type Props = {
  className?: string;
  children: React.ReactNode;
};

export function Card({ className, children }: Props) {
  return (
    <div className={`rounded border bg-white p-4 ${className ?? ""}`}>
      {children}
    </div>
  );
}
