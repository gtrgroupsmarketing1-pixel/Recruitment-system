import { setDocumentClientVisibleAction } from "@/modules/document/document.visibility.action";

type Doc = {
  id: string;
  label: string;
  fileName: string;
  type: string;
  expiryDate: Date | null;
  clientVisible?: boolean;
  syncStates?: Array<{ externalUrl: string | null; provider: string }>;
};

type Props = { documents: Doc[]; candidateId?: string; staff?: boolean };

export function DocumentList({ documents, candidateId, staff = false }: Props) {
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
            {staff && candidateId ? (
              <form action={setDocumentClientVisibleAction} className="mt-1">
                <input type="hidden" name="documentId" value={doc.id} />
                <input type="hidden" name="candidateId" value={candidateId} />
                <label className="inline-flex items-center gap-2 text-xs">
                  <input type="checkbox" name="clientVisible" defaultChecked={Boolean(doc.clientVisible)} />
                  Visible to client
                </label>
                <button type="submit" className="ml-2 text-xs underline">Save</button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
