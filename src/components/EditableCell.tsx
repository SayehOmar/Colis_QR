import { useMutation } from "@apollo/client";
import { useState } from "react";
import { CellCopyButton } from "./CellCopyButton";
import { SHIPMENTS_QUERY, UPDATE_SHIPMENT_CELL } from "../graphql";
import { useLanguage } from "../i18n/LanguageContext";
import type { FieldEdit } from "../types";

interface EditableCellProps {
  shipmentId: number;
  field: string;
  value: string | number;
  className?: string;
  edit?: FieldEdit | null;
  /** When true, cell is display-only (e.g. employee viewing someone else's scan). */
  readOnly?: boolean;
}

export function EditableCell({
  shipmentId,
  field,
  value,
  className = "",
  edit = null,
  readOnly = false,
}: EditableCellProps) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [tipOpen, setTipOpen] = useState(false);
  const [updateCell, { loading }] = useMutation(UPDATE_SHIPMENT_CELL);

  const startEdit = () => {
    if (readOnly) return;
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

  if (editing && !readOnly) {
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

  const displayOrDash = (raw: string | null | undefined) =>
    raw === "" || raw == null ? "—" : raw;

  const initialDisplay = displayOrDash(
    edit?.initialValue || edit?.previousValue,
  );
  const previousDisplay = displayOrDash(edit?.previousValue);
  const showSeparatePrevious =
    Boolean(edit) &&
    (edit?.initialValue || "") !== (edit?.previousValue || "") &&
    (edit?.previousValue || "") !== "";

  return (
    <td
      className={`group relative px-3 py-3 align-top text-sm leading-relaxed text-on-surface ${
        readOnly
          ? "cursor-default"
          : "cursor-pointer hover:bg-amber-50"
      } ${className}`}
      title={readOnly ? t("editOwnScansOnly") : t("clickToEdit")}
      onClick={startEdit}
    >
      <div className="flex items-start gap-1.5 pr-3">
        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
          {value === "" ? "—" : value}
        </span>
        <CellCopyButton
          text={value}
          className="opacity-70 group-hover:opacity-100"
        />
      </div>
      {edit ? (
        <span
          className="absolute right-1.5 top-1.5 z-10"
          onClick={(event) => event.stopPropagation()}
          onMouseEnter={() => setTipOpen(true)}
          onMouseLeave={() => setTipOpen(false)}
        >
          <span
            className="block h-2 w-2 rounded-full bg-orange-500 shadow-sm ring-1 ring-orange-600/40"
            aria-label={t("cellEdited")}
          />
          {tipOpen ? (
            <div
              role="tooltip"
              className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-max max-w-[14rem] rounded-md bg-slate-900 px-2.5 py-1.5 text-left text-[11px] leading-snug text-white shadow-lg"
            >
              <span className="block text-slate-300">{t("initialValue")}</span>
              <span className="block break-words font-medium">
                {initialDisplay}
              </span>
              {showSeparatePrevious ? (
                <>
                  <span className="mt-1 block text-slate-300">
                    {t("previousValue")}
                  </span>
                  <span className="block break-words font-medium">
                    {previousDisplay}
                  </span>
                </>
              ) : null}
              <span className="mt-1 block text-slate-400">{t("changedAt")}</span>
              <span className="block font-medium">{edit.editedAt || "—"}</span>
              {edit.editedByName ? (
                <>
                  <span className="mt-1 block text-slate-400">
                    {t("editedBy")}
                  </span>
                  <span className="block font-medium">{edit.editedByName}</span>
                </>
              ) : null}
            </div>
          ) : null}
        </span>
      ) : null}
    </td>
  );
}
