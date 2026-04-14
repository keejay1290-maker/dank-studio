# DankVault™ SDK: Adding New Masterpieces

To maintain the **DANKVAULT_STABLE_V2_FINALIZE** standard, new masterpieces must be registered in three locations. Following this pattern "counters reduced limits" by providing a fixed template for the agent to follow.

## Step 1: Generator Implementation
**File**: `shapeMasterpieces.ts`
Implement the mathematical logic. Always include `applyGovernor(pts)` at the end.
```typescript
export function gen_new_masterpiece(p: Record<string, any>): Point3D[] {
  const pts: Point3D[] = [];
  // Use drawWall, drawRing, drawDisk helpers
  return applyGovernor(pts);
}
```

## Step 2: Dispatcher Mapping
**File**: `shapeGenerators.ts`
Add the case to the `getRawPoints` switch statement.
```typescript
case 'new_masterpiece': return MP.gen_new_masterpiece(p);
```

## Step 3: Registry Registration
**File**: `completedBuilds.ts`
Add the build metadata for the UI and map locations.
```typescript
{ 
  id: "new_masterpiece", 
  category: "Sci-Fi", 
  icon: "✨", 
  name: "New Masterpiece", 
  tagline: "The latest addition.", 
  shape: "new_masterpiece", 
  params: {}, 
  frameObj: "staticobj_wall_milcnc_4", 
  fillObj: "", 
  ...NWAF, 
  objectNotes: "Zero-gap hull.", 
  interiorType: "structure", 
  lootTheme: "Military" 
}
```

## Step 4: Verification
- Run the **Geometry Auditor** subagent.
- Verify status is **PASS**.
- Fidelity Score should be $> 90$.
