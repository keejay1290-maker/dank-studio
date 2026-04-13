// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Core Types
// ─────────────────────────────────────────────────────────────────────────────

/** A single DayZ object placement point produced by a generator. */
export interface Point3D {
  x: number;
  y: number;
  z: number;
  yaw?:   number;   // degrees, 0 = North (+Z), clockwise
  pitch?: number;   // degrees, positive = nose up
  roll?:  number;   // degrees
  scale?: number;   // 1.0 = default
  name?:  string;   // DayZ class name e.g. "staticobj_castle_wall3"
}

/** An entry in the build library. */
export interface BuildEntry {
  id:          string;
  category:    string;
  icon:        string;
  name:        string;
  tagline:     string;
  shape:       string;             // generator key
  params:      Record<string, number>;
  frameObj:    string;             // primary object class
  posX:        number;
  posY:        number;
  posZ:        number;
  isSTier?:    boolean;
}

/** A placed object in Draw/Panel mode. */
export interface DrawnObject {
  id:      string;           // unique runtime id
  classname: string;         // DayZ class name
  x:       number;           // world X (metres)
  y:       number;           // world Y (height)
  z:       number;           // world Z
  yaw:     number;           // degrees
  pitch:   number;
  roll:    number;
  scale:   number;
}

/** A wall segment drawn in Draw mode (start → end line). */
export interface DrawnWall {
  id:        string;
  classname: string;         // DayZ wall class
  x1: number; y1: number; z1: number;
  x2: number; y2: number; z2: number;
}

/** An object type shown in the ObjectPicker. */
export interface ObjectDef {
  classname: string;
  label:     string;
  category:  string;
  width:     number;   // metres along wall face
  height:    number;   // metres
  depth:     number;   // metres (thickness)
  color:     string;   // preview hex
}

/** App-level mode. */
export type AppMode = 'library' | 'draw' | 'panel';
