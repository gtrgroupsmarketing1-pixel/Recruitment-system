import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-muted-foreground">
        Your role doesn&apos;t have permission for this action.
      </p>
      <Link href="/" className="text-primary underline">
        Return home
      </Link>
    </div>
  );
}
