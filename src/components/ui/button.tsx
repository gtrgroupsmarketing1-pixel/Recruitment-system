type Props = {
  type?: "button" | "submit";
  className?: string;
  children: React.ReactNode;
};

export function Button({ type = "submit", className, children }: Props) {
  return (
    <button
      type={type}
      className={`rounded bg-black px-4 py-2 text-white ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
