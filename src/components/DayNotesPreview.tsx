import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { CALENDAR_NOTES_QUERY } from "../graphql";
import { useLanguage } from "../i18n/LanguageContext";
import type { CalendarNote } from "./CalendarNotesFab";

interface CalendarNotesResult {
  calendarNotes: CalendarNote[];
}

function isoDay(offset = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function NoteCard({
  title,
  dateLabel,
  note,
  emptyLabel,
}: {
  title: string;
  dateLabel: string;
  note: CalendarNote | null;
  emptyLabel: string;
}) {
  const place = [note?.city, note?.regionName, note?.country].filter(Boolean).join(" · ");
  return (
    <section className="app-card flex min-h-[9rem] flex-col p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-on-surface">{title}</h2>
          <p className="text-xs text-on-surface-variant">{dateLabel}</p>
        </div>
        <span className="material-symbols-outlined text-[20px] text-tertiary" aria-hidden>
          sticky_note_2
        </span>
      </div>
      {!note || (!note.noteText.trim() && !place) ? (
        <p className="mt-auto text-sm text-on-surface-variant">{emptyLabel}</p>
      ) : (
        <div className="mt-1 space-y-2">
          {place ? (
            <p className="text-xs font-semibold text-secondary">{place}</p>
          ) : null}
          {note.noteText.trim() ? (
            <p className="whitespace-pre-wrap text-sm text-on-surface">{note.noteText}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** Dashboard preview of today's and tomorrow's calendar notes. */
export function DayNotesPreview() {
  const { t, language } = useLanguage();
  const locale = language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR";
  const { data } = useQuery<CalendarNotesResult>(CALENDAR_NOTES_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const todayKey = isoDay(0);
  const tomorrowKey = isoDay(1);

  const notesByDate = useMemo(() => {
    const map = new Map<string, CalendarNote>();
    for (const note of data?.calendarNotes ?? []) {
      map.set(note.noteDate, note);
    }
    return map;
  }, [data?.calendarNotes]);

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y!, m! - 1, d!).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <NoteCard
        title={t("dashNoteToday")}
        dateLabel={formatDate(todayKey)}
        note={notesByDate.get(todayKey) ?? null}
        emptyLabel={t("dashNoteEmpty")}
      />
      <NoteCard
        title={t("dashNoteTomorrow")}
        dateLabel={formatDate(tomorrowKey)}
        note={notesByDate.get(tomorrowKey) ?? null}
        emptyLabel={t("dashNoteEmpty")}
      />
    </div>
  );
}
