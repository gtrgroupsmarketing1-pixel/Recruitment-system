type Props = { message: string };

export function EmptyState({ message }: Props) {
  return (
    <p className="rounded border border-dashed p-6 text-center text-sm text-neutral-500">
      {message}
    </p>
  );
}
