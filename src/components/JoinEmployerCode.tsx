import { ClipboardEvent, KeyboardEvent, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

const SLOT_COUNT = 6;

function normalizeChar(ch: string): string {
  return ch.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

interface JoinEmployerCodeProps {
  onSubmit: (code: string) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
}

export function JoinEmployerCode({
  onSubmit,
  submitting = false,
  error = null,
  submitLabel,
}: JoinEmployerCodeProps) {
  const { t } = useLanguage();
  const [slots, setSlots] = useState<string[]>(() => Array(SLOT_COUNT).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = slots.join("");
  const complete = code.length === SLOT_COUNT;

  const focusAt = (index: number) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const applyChars = (start: number, chars: string) => {
    const next = [...slots];
    let cursor = start;
    for (const ch of chars) {
      if (cursor >= SLOT_COUNT) break;
      const normalized = normalizeChar(ch);
      if (!normalized) continue;
      next[cursor] = normalized;
      cursor += 1;
    }
    setSlots(next);
    focusAt(Math.min(cursor, SLOT_COUNT - 1));
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = normalizeChar(raw);
    if (cleaned.length > 1) {
      applyChars(index, cleaned);
      return;
    }
    const next = [...slots];
    next[index] = cleaned.slice(-1);
    setSlots(next);
    if (cleaned && index < SLOT_COUNT - 1) {
      focusAt(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !slots[index] && index > 0) {
      event.preventDefault();
      const next = [...slots];
      next[index - 1] = "";
      setSlots(next);
      focusAt(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    }
    if (event.key === "ArrowRight" && index < SLOT_COUNT - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const text = normalizeChar(event.clipboardData.getData("text"));
    if (!text) return;
    applyChars(index, text);
  };

  const handleSubmit = async () => {
    if (!complete || submitting) return;
    await onSubmit(code);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface-variant">{t("joinCodeHint")}</p>
      <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label={t("joinCodeLabel")}>
        {slots.map((value, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            maxLength={6}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            onFocus={(e) => e.target.select()}
            disabled={submitting}
            className="h-12 w-10 rounded-xl border border-outline-variant bg-surface-container-lowest text-center font-mono text-lg font-bold uppercase text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:h-14 sm:w-12 sm:text-xl"
            aria-label={`${t("joinCodeLabel")} ${index + 1}`}
          />
        ))}
      </div>
      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        className="app-btn-navy w-full"
        disabled={!complete || submitting}
        onClick={() => void handleSubmit()}
      >
        {submitting ? t("authLoading") : submitLabel ?? t("joinCodeSubmit")}
      </button>
      <p className="text-center text-xs text-on-surface-variant">{t("joinCodeFormat")}</p>
    </div>
  );
}
