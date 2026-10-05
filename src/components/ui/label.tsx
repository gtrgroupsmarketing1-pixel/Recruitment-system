type Props = {
  htmlFor?: string;
  children: React.ReactNode;
};

export function Label({ htmlFor, children }: Props) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {children}
    </label>
  );
}
