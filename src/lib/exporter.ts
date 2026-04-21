// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — DayZ Editor JSON Exporter
// Output matches DayZ Editor import format:
//   { "Objects": [{ "name", "pos": [x,y,z], "ypr": [yaw,pitch,roll], "scale" }] }
// ─────────────────────────────────────────────────────────────────────────────
import type { Point3D, DrawnObject, DrawnWall } from "./types";
import { getObjectWidth } from "./constants";

export interface ExportOptions {
  originX?: number;
  originY?: number;
  originZ?: number;
  label?:   string;
}

interface EditorEntry {
  name:  string;
  pos:   [number, number, number];
  ypr:   [number, number, number];
  scale: number;
}

function toJSON(entries: EditorEntry[]): string {
  return JSON.stringify({ Objects: entries }, null, 4);
}

function pt3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Convert a Point3D array (generator output) to DayZ Editor JSON. */
export function exportGeneratorPoints(
  pts:  Point3D[],
  opts: ExportOptions = {},
): string {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const oz = opts.originZ ?? 0;

  const entries: EditorEntry[] = pts.map(p => ({
    name:  p.name  ?? "staticobj_castle_wall3",
    pos:   [pt3(ox + p.x), pt3(oy + p.y), pt3(oz + p.z)],
    ypr:   [p.yaw ?? 0, p.pitch ?? 0, p.roll ?? 0],
    scale: p.scale ?? 1,
  }));

  return toJSON(entries);
}

/** Convert drawn wall segments to DayZ Editor JSON. */
export function exportDrawnWalls(
  walls: DrawnWall[],
  opts:  ExportOptions = {},
): string {
  return toJSON(drawnWallsToEntries(walls, opts));
}

/** Convert individually placed objects to DayZ Editor JSON. */
export function exportDrawnObjects(
  objects: DrawnObject[],
  opts:    ExportOptions = {},
): string {
  return toJSON(drawnObjectsToEntries(objects, opts));
}

/** Merge walls + objects into one combined DayZ Editor JSON (use in applyExport). */
export function exportCombinedDraw(
  walls:   DrawnWall[],
  objects: DrawnObject[],
  opts:    ExportOptions = {},
): string {
  return toJSON([
    ...drawnWallsToEntries(walls, opts),
    ...drawnObjectsToEntries(objects, opts),
  ]);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function drawnWallsToEntries(walls: DrawnWall[], opts: ExportOptions): EditorEntry[] {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const oz = opts.originZ ?? 0;
  const entries: EditorEntry[] = [];

  for (const w of walls) {
    const dx  = w.x2 - w.x1, dz = w.z2 - w.z1, dy = w.y2 - w.y1;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.1) continue;

    const panelW = getObjectWidth(w.classname);
    const n      = Math.max(1, Math.round(len / panelW));
    const scale  = (len / n) / panelW;
    const yaw    = Math.atan2(dx, dz) * 180 / Math.PI;
    const pitch  = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * 180 / Math.PI;

    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      entries.push({
        name:  w.classname,
        pos:   [pt3(ox + w.x1 + dx * t), pt3(oy + w.y1 + dy * t), pt3(oz + w.z1 + dz * t)],
        ypr:   [+yaw.toFixed(3), +pitch.toFixed(3), 0],
        scale: +scale.toFixed(6),
      });
    }
  }
  return entries;
}

function drawnObjectsToEntries(objects: DrawnObject[], opts: ExportOptions): EditorEntry[] {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const oz = opts.originZ ?? 0;

  return objects.map(o => ({
    name:  o.classname,
    pos:   [pt3(ox + o.x), pt3(oy + o.y), pt3(oz + o.z)],
    ypr:   [o.yaw ?? 0, o.pitch ?? 0, o.roll ?? 0],
    scale: o.scale ?? 1,
  }));
}
