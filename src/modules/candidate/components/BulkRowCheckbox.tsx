type Props = {
  value: string;
  checked: boolean;
  onChange: (value: string, checked: boolean) => void;
};

export function BulkRowCheckbox({ value, checked, onChange }: Props) {
  return (
    <input
      type="checkbox"
      value={value}
      checked={checked}
      onChange={(event) => onChange(value, event.target.checked)}
      className="h-4 w-4"
    />
  );
}
