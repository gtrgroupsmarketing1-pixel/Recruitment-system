type Props = {
  id?: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
};

export function Input({
  id,
  name,
  type = "text",
  defaultValue,
  required,
  className,
}: Props) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      defaultValue={defaultValue}
      required={required}
      className={`rounded border px-3 py-2 ${className ?? ""}`}
    />
  );
}
