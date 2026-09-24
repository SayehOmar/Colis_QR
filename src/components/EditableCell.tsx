import { useMutation } from "@apollo/client";
import { useState } from "react";
import { SHIPMENTS_QUERY, UPDATE_SHIPMENT_CELL } from "../graphql";
import { useLanguage } from "../i18n/LanguageContext";

interface EditableCellProps {
  shipmentId: number;
  field: string;
  value: string | number;
  className?: string;
}

export function EditableCell({
  shipmentId,
  field,
  value,
  className = "",
}: EditableCellProps) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [updateCell, { loading }] = useMutation(UPDATE_SHIPMENT_CELL);

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
  };

  const save = async () => {
    if (draft === String(value)) {
      setEditing(false);
      return;
    }
    const result = await updateCell({
      variables: { shipmentId, field, value: draft },
      refetchQueries: [{ query: SHIPMENTS_QUERY }],
    });
    if (!result.data?.updateShipmentCell?.success) {
      alert(result.data?.updateShipmentCell?.message ?? t("actionFailed"));
      return;
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <td className={`px-3 py-2 align-top ${className}`}>
        <textarea
          autoFocus
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void save();
            }
            if (event.key === "Escape") setEditing(false);
          }}
          className="w-full min-w-[8rem] rounded border border-amber-400 px-2 py-1 text-sm leading-relaxed"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={loading}
          className="mt-1 rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-slate-900"
        >
          {t("saveCell")}
        </button>
      </td>
    );
  }

  return (
    <td
      className={`cursor-pointer px-3 py-3 align-top text-sm leading-relaxed text-on-surface hover:bg-amber-50 ${className}`}
      title={t("clickToEdit")}
      onClick={startEdit}
    >
      <span className="block whitespace-pre-wrap break-words">{value === "" ? "—" : value}</span>
    </td>
  );
}
