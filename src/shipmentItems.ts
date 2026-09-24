const STORAGE_KEY = "crossmed-custom-shipment-items";

export const DEFAULT_SHIPMENT_ITEMS = [
  "Olive oil",
  "Harissa",
  "Spices",
  "Couscous",
  "Dates",
  "Pastries",
  "Cheese",
  "Honey",
  "Olives",
  "Tea",
  "Coffee",
  "Clothes",
  "Documents",
  "Electronics",
  "Luggage",
] as const;

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

export function loadAllShipmentItems(): string[] {
  const custom = readCustomItems();
  const merged = new Map<string, string>();
  for (const item of DEFAULT_SHIPMENT_ITEMS) {
    merged.set(item.toLowerCase(), item);
  }
  for (const item of custom) {
    const key = item.toLowerCase();
    if (!merged.has(key)) {
      merged.set(key, item);
    }
  }
  return [...merged.values()].sort((a, b) => a.localeCompare(b));
}

/** Persist a custom item locally so it appears next time on this machine. */
export function cacheCustomShipmentItem(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const all = loadAllShipmentItems();
  const exists = all.some((item) => item.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return all.find((item) => item.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
  }
  const custom = readCustomItems();
  custom.push(trimmed);
  writeCustomItems(custom);
  return trimmed;
}
