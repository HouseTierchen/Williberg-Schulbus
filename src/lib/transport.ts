// Helfer fuer Slots, ISO-Wochen und die taegliche Bedarfsberechnung.

import { prisma } from "./db";

export const SLOTS = ["MORNING", "NOON", "AFTERNOON"] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_LABELS: Record<Slot, string> = {
  MORNING: "Hin (morgens)",
  NOON: "Rück (Mittag)",
  AFTERNOON: "Rück (Nachmittag)",
};

export const MODES = ["BUS", "NONE", "CUSTOM"] as const;
export type Mode = (typeof MODES)[number];

export const MODE_LABELS: Record<Mode, string> = {
  BUS: "Bus",
  NONE: "kein Bus",
  CUSTOM: "Sonderzeit",
};

export const DAYS = [1, 2, 3, 4, 5] as const;
export const DAY_LABELS: Record<number, string> = {
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
};

// Berechnet ISO-Woche und ISO-Wochen-Jahr eines Datums.
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function dayOfWeekMonFri(date: Date): number | null {
  const dow = date.getDay(); // 0=So .. 6=Sa
  if (dow >= 1 && dow <= 5) return dow;
  return null;
}

export type ResolvedNeed = {
  slot: Slot;
  mode: Mode;
  customTime?: string | null;
  customStop?: string | null;
  notes?: string | null;
  source: "regular" | "special";
};

// Liefert pro Slot den gueltigen Bedarf fuer ein Kind an einem konkreten Tag.
// Reihenfolge: Spezialwoche (active) -> Regulaer.
export async function resolveNeedsForChild(
  childId: string,
  date: Date
): Promise<Record<Slot, ResolvedNeed | null>> {
  const dow = dayOfWeekMonFri(date);
  const result: Record<Slot, ResolvedNeed | null> = {
    MORNING: null,
    NOON: null,
    AFTERNOON: null,
  };
  if (dow == null) return result;

  const { year, week } = isoWeek(date);
  const special = await prisma.specialWeek.findFirst({
    where: { year, weekNumber: week, active: true },
    include: { overrides: { where: { childId, dayOfWeek: dow } } },
  });
  if (special) {
    for (const o of special.overrides) {
      if ((SLOTS as readonly string[]).includes(o.slot)) {
        result[o.slot as Slot] = {
          slot: o.slot as Slot,
          mode: o.mode as Mode,
          customTime: o.customTime,
          customStop: o.customStop,
          notes: o.notes,
          source: "special",
        };
      }
    }
  }

  const regular = await prisma.transportNeed.findMany({
    where: { childId, dayOfWeek: dow },
  });
  for (const r of regular) {
    if (result[r.slot as Slot]) continue; // Spezialwoche hat Vorrang
    if ((SLOTS as readonly string[]).includes(r.slot)) {
      result[r.slot as Slot] = {
        slot: r.slot as Slot,
        mode: r.mode as Mode,
        customTime: r.customTime,
        customStop: r.customStop,
        notes: r.notes,
        source: "regular",
      };
    }
  }
  return result;
}

export async function isSchoolHoliday(date: Date) {
  const d = new Date(date.toDateString());
  return prisma.schoolHoliday.findFirst({
    where: {
      fromDate: { lte: new Date(d.getTime() + 24 * 60 * 60 * 1000 - 1) },
      toDate: { gte: d },
    },
  });
}

// Alle vom Gemeinderat gepflegten Haltestellen-Namen (eindeutig, sortiert).
export async function getAllStopNames(): Promise<string[]> {
  const stops = await prisma.busStop.findMany({
    where: { route: { active: true } },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  const set = new Set<string>();
  for (const s of stops) {
    const n = s.name.trim();
    if (n) set.add(n);
  }
  return Array.from(set);
}
