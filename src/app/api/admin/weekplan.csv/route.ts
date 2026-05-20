import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DAYS,
  DAY_LABELS,
  SLOTS,
  SLOT_LABELS,
  isoWeek,
  isSchoolHoliday,
  resolveNeedsForChild,
} from "@/lib/transport";

function dateOfIsoWeek(year: number, week: number, dow: number) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay() || 7;
  const isoMonday = new Date(simple);
  isoMonday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
  const target = new Date(isoMonday);
  target.setUTCDate(isoMonday.getUTCDate() + (dow - 1));
  return target;
}

function csvEscape(s: string) {
  if (/[";\n,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  await requireAdmin();
  const url = new URL(req.url);
  const now = new Date();
  const cur = isoWeek(now);
  const year = Number(url.searchParams.get("year")) || cur.year;
  const week = Number(url.searchParams.get("week")) || cur.week;

  const children = await prisma.child.findMany({ include: { parent: true } });

  const rows: string[][] = [];
  rows.push([
    "Datum",
    "Wochentag",
    "Slot",
    "Kind",
    "Schule",
    "Klasse",
    "Haltestelle",
    "Modus",
    "Sonderzeit",
    "Familie",
    "Kontakt",
    "Bemerkung",
  ]);

  for (const d of DAYS) {
    const date = dateOfIsoWeek(year, week, d);
    const holiday = await isSchoolHoliday(date);
    if (holiday) {
      rows.push([
        date.toLocaleDateString("de-CH"),
        DAY_LABELS[d],
        "",
        "",
        "",
        "",
        "",
        "SCHULFREI",
        "",
        "",
        "",
        holiday.name,
      ]);
      continue;
    }
    const dayStart = new Date(date.toDateString());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const absences = await prisma.absence.findMany({
      where: { fromDate: { lte: dayEnd }, toDate: { gte: dayStart } },
      select: { childId: true },
    });
    const absentIds = new Set(absences.map((a) => a.childId));
    for (const c of children) {
      const needs = await resolveNeedsForChild(c.id, date);
      for (const slot of SLOTS) {
        const n = needs[slot];
        if (!n || n.mode === "NONE") continue;
        rows.push([
          date.toLocaleDateString("de-CH"),
          DAY_LABELS[d],
          SLOT_LABELS[slot],
          `${c.firstName} ${c.lastName}`,
          c.school,
          c.grade,
          n.customStop ?? c.stopName ?? "",
          n.mode === "CUSTOM" ? "Sonderzeit" : "Bus",
          n.customTime ?? "",
          c.parent.name,
          c.parent.phone ?? c.parent.email,
          [
            n.source === "special" ? "Spezialwoche" : "",
            absentIds.has(c.id) ? "ABGEMELDET" : "",
            n.notes ?? "",
          ]
            .filter(Boolean)
            .join("; "),
        ]);
      }
    }
  }

  const csv =
    "﻿" +
    rows.map((r) => r.map((c) => csvEscape(c ?? "")).join(";")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="schulbus-wiliberg-${year}-KW${week}.csv"`,
    },
  });
}
