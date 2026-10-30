import { useMutation } from "@apollo/client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SHIPMENTS_QUERY, UPDATE_SHIPMENT_CELL } from "../graphql";
import { formatLocalDateTime } from "../i18n/formatDateTime";
import { useLanguage } from "../i18n/LanguageContext";
import type { FieldEdit } from "../types";

interface DeliveredCellProps {
  shipmentId: number;
  delivered: boolean;
  deliveredAt?: string | null;
  deliveredByName?: string;
  edit?: FieldEdit | null;
  readOnly?: boolean;
}

export function DeliveredCell({
  shipmentId,
  delivered,
  deliveredAt = null,
  deliveredByName = "",
  edit = null,
  readOnly = false,
}: DeliveredCellProps) {
  const { t, language } = useLanguage();
  const locale =
    language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [popPos, setPopPos] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [updateCell, { loading }] = useMutation(UPDATE_SHIPMENT_CELL);

  useEffect(() => {
    if (!confirmOpen) return;
    const hide = () => {
      setConfirmOpen(false);
      setPopPos(null);
    };
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, [confirmOpen]);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConfirmOpen(false);
        setPopPos(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  const openConfirm = () => {
    if (readOnly || loading) return;
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopPos({ x: rect.left, y: rect.bottom + 6 });
    setConfirmOpen(true);
    setTipOpen(false);
  };

  const confirm = async () => {
    const next = !delivered;
    const result = await updateCell({
      variables: {
        shipmentId,
        field: "delivered",
        value: next ? "true" : "false",
      },
      refetchQueries: [{ query: SHIPMENTS_QUERY }],
    });
    if (!result.data?.updateShipmentCell?.success) {
      alert(result.data?.updateShipmentCell?.message ?? t("actionFailed"));
      return;
    }
    setConfirmOpen(false);
    setPopPos(null);
  };

  const hasHistory = Boolean(edit) || delivered;

  return (
    <td className="relative px-2 py-3 align-top">
      <div className="flex items-center justify-center gap-1">
        <button
          ref={btnRef}
          type="button"
          disabled={readOnly || loading}
          onClick={openConfirm}
          title={
            readOnly
              ? t("editOwnScansOnly")
              : delivered
                ? t("markNotDelivered")
                : t("markDelivered")
          }
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition ${
            delivered
              ? "border-emerald-500/50 bg-emerald-100 text-emerald-700"
              : "border-outline-variant/40 bg-white text-on-surface-variant hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
          } ${readOnly ? "cursor-default opacity-60" : "cursor-pointer"}`}
          aria-label={delivered ? t("deliveredStatus") : t("markDelivered")}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            {delivered ? "check_circle" : "radio_button_unchecked"}
          </span>
        </button>
        {hasHistory ? (
          <span
            className="relative"
            onMouseEnter={() => !confirmOpen && setTipOpen(true)}
            onMouseLeave={() => setTipOpen(false)}
          >
            <span
              className="block h-2 w-2 rounded-full bg-orange-500 shadow-sm ring-1 ring-orange-600/40"
              aria-label={t("deliveryHistory")}
            />
            {tipOpen ? (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-max max-w-[14rem] -translate-x-1/2 rounded-md bg-slate-900 px-2.5 py-1.5 text-left text-[11px] leading-snug text-white shadow-lg"
              >
                <span className="block text-slate-300">
                  {t("deliveryHistory")}
                </span>
                <span className="mt-1 block font-medium">
                  {delivered ? t("deliveredStatus") : t("notDeliveredStatus")}
                </span>
                {deliveredAt || edit?.editedAt ? (
                  <>
                    <span className="mt-1 block text-slate-400">
                      {t("changedAt")}
                    </span>
                    <span className="block font-medium">
                      {formatLocalDateTime(
                        deliveredAt || edit?.editedAt || "",
                        locale,
                      )}
                    </span>
                  </>
                ) : null}
                {deliveredByName || edit?.editedByName ? (
                  <>
                    <span className="mt-1 block text-slate-400">
                      {t("editedBy")}
                    </span>
                    <span className="block font-medium">
                      {deliveredByName || edit?.editedByName}
                    </span>
                  </>
                ) : null}
                {edit?.previousValue ? (
                  <>
                    <span className="mt-1 block text-slate-400">
                      {t("previousValue")}
                    </span>
                    <span className="block font-medium">
                      {edit.previousValue === "true"
                        ? t("deliveredStatus")
                        : t("notDeliveredStatus")}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}
          </span>
        ) : null}
      </div>

      {confirmOpen && popPos
        ? createPortal(
            <>
              <button
                type="button"
                aria-label={t("cancel")}
                className="fixed inset-0 z-[9998] cursor-default bg-transparent"
                onClick={() => {
                  setConfirmOpen(false);
                  setPopPos(null);
                }}
              />
              <div
                role="dialog"
                aria-modal="true"
                className="fixed z-[9999] w-56 rounded-lg border border-outline-variant/30 bg-white p-3 text-left shadow-xl"
                style={{ top: popPos.y, left: popPos.x }}
                onClick={(event) => event.stopPropagation()}
              >
                <p className="text-sm font-medium text-on-surface">
                  {delivered ? t("confirmUndeliver") : t("confirmDeliver")}
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded px-2.5 py-1 text-xs font-medium text-on-surface-variant hover:bg-slate-100"
                    onClick={() => {
                      setConfirmOpen(false);
                      setPopPos(null);
                    }}
                    disabled={loading}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    className={`rounded px-2.5 py-1 text-xs font-semibold text-white ${
                      delivered
                        ? "bg-slate-600 hover:bg-slate-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                    onClick={() => void confirm()}
                    disabled={loading}
                  >
                    {loading ? t("loading") : t("confirm")}
                  </button>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </td>
  );
}
