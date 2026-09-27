import { useMutation, useQuery } from "@apollo/client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CALENDAR_NOTES_QUERY,
  DELETE_CALENDAR_NOTE,
  UPSERT_CALENDAR_NOTE,
} from "../graphql";
import { useLanguage } from "../i18n/LanguageContext";
import {
  emptyLocationSelection,
  LocationCascade,
  locationFromStored,
  type LocationSelection,
} from "./LocationCascade";

export interface CalendarNote {
  id: number;
  noteDate: string;
  noteText: string;
  originCountry: string;
  originRegionName: string;
  originCity: string;
  country: string;
  regionName: string;
  city: string;
  createdAt: string;
  updatedAt: string | null;
}

interface CalendarNotesResult {
  calendarNotes: CalendarNote[];
}

function monthLabel(year: number, month: number, locale: string): string {
  return new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function hasNoteContent(note: CalendarNote | null | undefined): boolean {
  if (!note) return false;
  return Boolean(note.noteText.trim() || note.city || note.country || note.regionName);
}

export function CalendarNotesFab() {
  const { t, language } = useLanguage();
  const locale = language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR";
  const [panelOpen, setPanelOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(() =>
    today.toISOString().slice(0, 10)
  );
  const [noteText, setNoteText] = useState("");
  const [location, setLocation] = useState<LocationSelection>(emptyLocationSelection);
  const [status, setStatus] = useState<string | null>(null);

  const { data } = useQuery<CalendarNotesResult>(CALENDAR_NOTES_QUERY, {
    skip: !panelOpen,
    fetchPolicy: "cache-and-network",
  });
  const [upsertNote, { loading: saving }] = useMutation(UPSERT_CALENDAR_NOTE, {
    refetchQueries: [{ query: CALENDAR_NOTES_QUERY }],
  });
  const [deleteNote, { loading: deleting }] = useMutation(DELETE_CALENDAR_NOTE, {
    refetchQueries: [{ query: CALENDAR_NOTES_QUERY }],
  });

  const notes = data?.calendarNotes ?? [];
  const notesByDate = useMemo(() => {
    const map = new Map<string, CalendarNote>();
    for (const note of notes) {
      map.set(note.noteDate, note);
    }
    return map;
  }, [notes]);

  const selectedNote = notesByDate.get(selectedDate) ?? null;

  useEffect(() => {
    if (!dayOpen) return;
    setNoteText(selectedNote?.noteText ?? "");
    setLocation(
      locationFromStored({
        country: selectedNote?.country,
        regionName: selectedNote?.regionName,
        city: selectedNote?.city,
      })
    );
    setStatus(null);
  }, [dayOpen, selectedDate, selectedNote]);

  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const startPad = (firstWeekday + 6) % 7;

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const openDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDayOpen(true);
    setStatus(null);
  };

  const closeDay = () => {
    setDayOpen(false);
    setStatus(null);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    const result = await upsertNote({
      variables: {
        noteDate: selectedDate,
        noteText: noteText.trim(),
        originCountry: "",
        originRegionName: "",
        originCity: "",
        country: location.country,
        regionName: location.regionName,
        city: location.city,
      },
    });
    if (!result.data?.upsertCalendarNote?.success) {
      setStatus(result.data?.upsertCalendarNote?.message ?? t("actionFailed"));
      return;
    }
    const kept = noteText.trim() || location.city || location.country;
    setStatus(kept ? t("dashCalNoteSaved") : t("dashCalNoteCleared"));
    if (kept) {
      setTimeout(() => closeDay(), 450);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote || selectedNote.id <= 0) {
      setNoteText("");
      setLocation(emptyLocationSelection());
      closeDay();
      return;
    }
    setStatus(null);
    const result = await deleteNote({ variables: { noteId: selectedNote.id } });
    if (!result.data?.deleteCalendarNote?.success) {
      setStatus(result.data?.deleteCalendarNote?.message ?? t("actionFailed"));
      return;
    }
    setNoteText("");
    setLocation(emptyLocationSelection());
    setStatus(t("dashCalNoteCleared"));
    setTimeout(() => closeDay(), 350);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPanelOpen((v) => !v);
          setDayOpen(false);
        }}
        className={`fixed bottom-5 right-5 z-[4000] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:scale-105 ${
          panelOpen ? "bg-primary text-on-primary" : "bg-tertiary text-on-tertiary"
        }`}
        aria-label={t("dashCalendarTitle")}
        title={t("dashCalendarTitle")}
      >
        <span className="material-symbols-outlined text-[28px]" aria-hidden>
          {panelOpen ? "close" : "calendar_month"}
        </span>
      </button>

      {panelOpen ? (
        <div className="fixed bottom-[5.5rem] right-5 z-[4000] w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-2xl">
          <div className="flex items-center justify-between border-b border-outline-variant/40 bg-primary px-4 py-3 text-on-primary">
            <div>
              <p className="text-sm font-bold">{t("dashCalendarTitle")}</p>
              <p className="text-[11px] opacity-80">{t("dashCalFabHint")}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPanelOpen(false);
                setDayOpen(false);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15"
              aria-label={t("dashCloseDrawer")}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="app-btn-ghost h-8 w-8 p-0 text-sm"
                aria-label={t("dashCalPrev")}
              >
                ‹
              </button>
              <p className="text-sm font-bold capitalize text-on-surface">
                {monthLabel(viewYear, viewMonth, locale)}
              </p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="app-btn-ghost h-8 w-8 p-0 text-sm"
                aria-label={t("dashCalNext")}
              >
                ›
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-on-surface-variant">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPad }).map((_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const active = dayOpen && dateStr === selectedDate;
                const hasNote = hasNoteContent(notesByDate.get(dateStr));
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => openDay(dateStr)}
                    className={`relative flex h-9 flex-col items-center justify-center rounded-lg text-xs font-semibold transition ${
                      active
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface hover:bg-secondary-container"
                    }`}
                  >
                    {day}
                    {hasNote ? (
                      <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-tertiary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {panelOpen && dayOpen ? (
        <div className="fixed inset-0 z-[4100] flex items-end justify-end bg-primary/25 p-4 backdrop-blur-[1px] sm:items-center sm:justify-center">
          <div
            className="absolute inset-0"
            onClick={closeDay}
            aria-hidden
          />
          <form
            onSubmit={handleSave}
            className="relative z-10 w-[min(100%,22rem)] rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-on-surface">{t("dashCalNoteFor")}</p>
                <p className="text-xs text-on-surface-variant">{selectedDate}</p>
              </div>
              <button
                type="button"
                onClick={closeDay}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/70 text-on-surface hover:border-secondary"
                aria-label={t("dashCloseDrawer")}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <label className="app-label text-xs">
              {t("dashCalNotes")}
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                className="app-input mt-1 min-h-[4.5rem] resize-y text-sm"
                placeholder={t("dashCalNoteHint")}
                autoFocus
              />
            </label>

            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                {t("locTitle")}
              </p>
              <LocationCascade
                value={location}
                onChange={setLocation}
                showPostal={false}
                compact
                idPrefix="cal-day"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="app-btn-orange flex-1 text-xs"
              >
                {saving ? "…" : t("dashCalSaveNote")}
              </button>
              {(hasNoteContent(selectedNote) ||
                noteText.trim() ||
                location.city ||
                location.country) && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="app-btn-ghost text-xs text-red-600"
                >
                  {t("dashCalRemove")}
                </button>
              )}
            </div>
            {status ? (
              <p className="mt-2 text-[11px] font-medium text-secondary">{status}</p>
            ) : null}
          </form>
        </div>
      ) : null}
    </>
  );
}
