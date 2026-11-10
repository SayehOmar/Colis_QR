import type { TranslationKey } from "./i18n/translations";

const STORAGE_KEY = "crossmed-custom-shipment-items";

/** Canonical English ids stored in QR / DB — keep stable. */
export const DEFAULT_SHIPMENT_ITEMS = [
  { id: "Olive oil", labelKey: "itemOliveOil" },
  { id: "Harissa", labelKey: "itemHarissa" },
  { id: "Spices", labelKey: "itemSpices" },
  { id: "Couscous", labelKey: "itemCouscous" },
  { id: "Dates", labelKey: "itemDates" },
  { id: "Pastries", labelKey: "itemPastries" },
  { id: "Cheese", labelKey: "itemCheese" },
  { id: "Honey", labelKey: "itemHoney" },
  { id: "Olives", labelKey: "itemOlives" },
  { id: "Tea", labelKey: "itemTea" },
  { id: "Coffee", labelKey: "itemCoffee" },
  { id: "Clothes", labelKey: "itemClothes" },
  { id: "Documents", labelKey: "itemDocuments" },
  { id: "Electronics", labelKey: "itemElectronics" },
  { id: "Luggage", labelKey: "itemLuggage" },
] as const satisfies ReadonlyArray<{ id: string; labelKey: TranslationKey }>;

const DEFAULT_LABEL_BY_ID = new Map(
  DEFAULT_SHIPMENT_ITEMS.map((item) => [item.id.toLowerCase(), item.labelKey])
);

export type ShipmentItemOption = {
  id: string;
  /** Translation key for defaults; null for custom free-text items. */
  labelKey: TranslationKey | null;
};

function readCustomItems(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeCustomItems(items: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function loadAllShipmentItems(): ShipmentItemOption[] {
  const custom = readCustomItems();
  const merged = new Map<string, ShipmentItemOption>();
  for (const item of DEFAULT_SHIPMENT_ITEMS) {
    merged.set(item.id.toLowerCase(), {
      id: item.id,
      labelKey: item.labelKey,
    });
  }
  for (const item of custom) {
    const key = item.toLowerCase();
    if (!merged.has(key)) {
      merged.set(key, { id: item, labelKey: null });
    }
  }
  return [...merged.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Persist a custom item locally so it appears next time on this machine. */
export function cacheCustomShipmentItem(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const all = loadAllShipmentItems();
  const exists = all.some((item) => item.id.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return (
      all.find((item) => item.id.toLowerCase() === trimmed.toLowerCase())?.id ??
      trimmed
    );
  }
  const custom = readCustomItems();
  custom.push(trimmed);
  writeCustomItems(custom);
  return trimmed;
}

/** Resolve display label for a stored item id (defaults are translated). */
export function shipmentItemLabel(
  id: string,
  t: (key: TranslationKey) => string
): string {
  const key = DEFAULT_LABEL_BY_ID.get(id.trim().toLowerCase());
  return key ? t(key) : id;
}
