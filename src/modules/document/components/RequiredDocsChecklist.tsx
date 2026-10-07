import { mapRequiredDoc } from "@/modules/compliance/document-mapping";

type Props = {
  required: string[];
  uploadedTypes: string[];
};

export function RequiredDocsChecklist({ required, uploadedTypes }: Props) {
  return (
    <ul className="text-xs text-neutral-600">
      {required.map((name) => {
        const mapped = mapRequiredDoc(name);
        const done = mapped ? uploadedTypes.includes(mapped) : false;
        return (
          <li key={name}>
            {done ? "[x]" : "[ ]"} {name}
            {mapped ? "" : " (not yet uploadable)"}
          </li>
        );
      })}
    </ul>
  );
}
