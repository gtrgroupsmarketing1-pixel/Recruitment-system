type Props = {
  userName: string;
  role: string;
};

export function TopBar({ userName, role }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-xs sm:block">
            <p className="font-medium leading-none">{userName}</p>
            <p className="mt-0.5 leading-none text-muted-foreground">
              {role.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}