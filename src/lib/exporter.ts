// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — DayZ .c File Exporter
// Produces SpawnObject() calls compatible with DayZ server init scripts.
// ─────────────────────────────────────────────────────────────────────────────
import type { Point3D, DrawnObject, DrawnWall } from "./types";
import { getObjectWidth } from "./constants";

export interface ExportOptions {
  originX?: number;
  originY?: number;
  originZ?: number;
  label?:   string;   // comment header label
}

const fmt = (n: number, d = 3) => n.toFixed(d);

/** Convert a Point3D array (generator output) to a DayZ init .c string. */
export function exportGeneratorPoints(
  pts:  Point3D[],
  opts: ExportOptions = {},
): string {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const oz = opts.originZ ?? 0;

  const lines: string[] = [
    `// ── Dank Studio Export ─────────────────────────────────`,
    `// Build  : ${opts.label ?? "Unnamed"}`,
    `// Objects: ${pts.length}`,
    `// Origin : ${fmt(ox)} ${fmt(oy)} ${fmt(oz)}`,
    `// ─────────────────────────────────────────────────────────`,
    ``,
  ];

  for (const p of pts) {
    const name  = p.name  ?? "staticobj_castle_wall3";
    const x     = fmt(ox + p.x);
    const y     = fmt(oy + p.y);
    const z     = fmt(oz + p.z);
    const yaw   = fmt(p.yaw   ?? 0);
    const pitch = fmt(p.pitch ?? 0);
    const roll  = fmt(p.roll  ?? 0);
    const scale = fmt(p.scale ?? 1, 4);
    lines.push(`SpawnObject("${name}", "${x} ${y} ${z}", "${yaw} ${pitch} ${roll}", ${scale});`);
  }

  return lines.join("\n");
}

/** Convert drawn wall segments to DayZ spawn commands. */
export function exportDrawnWalls(
  walls: DrawnWall[],
  opts:  ExportOptions = {},
): string {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const oz = opts.originZ ?? 0;
  const lines: string[] = [
    `// ── Dank Studio — Wall Draw Export`,
    `// Objects: ${countWallObjects(walls)}`,
    ``,
  ];

  for (const w of walls) {
    const dx  = w.x2 - w.x1, dz = w.z2 - w.z1, dy = w.y2 - w.y1;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.1) continue;

    const panelW  = getObjectWidth(w.classname);
    const n       = Math.max(1, Math.round(len / panelW));
    const scale   = (len / n) / panelW;
    const yaw     = Math.atan2(dx, dz) * 180 / Math.PI + 90;
    const pitch   = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * 180 / Math.PI;

    for (let i = 0; i < n; i++) {
      const t  = (i + 0.5) / n;
      const wx = fmt(ox + w.x1 + dx * t);
      const wy = fmt(oy + w.y1 + dy * t);
      const wz = fmt(oz + w.z1 + dz * t);
      lines.push(`SpawnObject("${w.classname}", "${wx} ${wy} ${wz}", "${fmt(yaw)} ${fmt(pitch)} 0.000", ${fmt(scale, 4)});`);
    }
  }
  return lines.join("\n");
}

/** Convert individually placed objects to DayZ spawn commands. */
export function exportDrawnObjects(
  objects: DrawnObject[],
  opts:    ExportOptions = {},
): string {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const oz = opts.originZ ?? 0;
  return objects.map(o =>
    `SpawnObject("${o.classname}", "${fmt(ox + o.x)} ${fmt(oy + o.y)} ${fmt(oz + o.z)}", "${fmt(o.yaw)} ${fmt(o.pitch)} ${fmt(o.roll)}", ${fmt(o.scale, 4)});`
  ).join("\n");
}

function countWallObjects(walls: DrawnWall[]): number {
  return walls.reduce((acc, w) => {
    const dx = w.x2 - w.x1, dz = w.z2 - w.z1, dy = w.y2 - w.y1;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return acc + Math.max(1, Math.round(len / getObjectWidth(w.classname)));
  }, 0);
}
