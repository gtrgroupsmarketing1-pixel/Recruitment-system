type Doc = {
  id: string;
  label: string;
  fileName: string;
  type: string;
  expiryDate: Date | null;
  syncStates?: Array<{ externalUrl: string | null; provider: string }>;
};

type Props = { documents: Doc[] };

export function DocumentList({ documents }: Props) {
  if (documents.length === 0) return <p className="text-sm text-neutral-500">No documents.</p>;
  return (
    <ul className="divide-y text-sm">
      {documents.map((doc) => {
        const link = doc.syncStates?.find((s) => s.externalUrl)?.externalUrl;
        return (
          <li key={doc.id} className="py-2">
            {doc.label} · {doc.type} · {doc.fileName}
            {doc.expiryDate ? ` · exp ${doc.expiryDate.toISOString().slice(0, 10)}` : ""}
            {link ? (
              <>
                {" "}
                · <a className="underline" href={link} target="_blank" rel="noreferrer">View in Drive</a>
              </>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
