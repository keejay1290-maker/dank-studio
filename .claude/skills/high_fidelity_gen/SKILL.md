# High-Fidelity Generation (DANKVAULT™ Standard)

This skill provides the mathematical and architectural standards for generating "S-TIER" DankVault masterpieces. It ensures zero-gap tiling, server-safe object counts, and realistic structural grounding.

## Core Standards

### 1. Zero-Gap Tiling (Dynamic Overlap)
- **Standard**: All structural walls MUST overlap by at least 20% to prevent light-leaks and visual gaps in the DayZ engine.
- **Algorithm**: `spacing = object_length * 0.8`.
- **Curvature Guard**: For curved shapes (rings, spheres), use **Arc-Length Parameterization**.
  - Calculate circumference $C = 2\pi R$.
  - Calculate required panels $N = \lceil C / (L \times 0.8) \rceil$.
  - This ensures a watertight seal regardless of the radius.

### 2. The Nitrado Governor (1200 Cap)
- **Standard**: No single build file should exceed **1,200 objects**.
- **Enforcement**:
  - If a build exceeds 1,200, the `budget_enforcement` step must **auto-scale** the entire structure down.
  - Scaling factor $S = \sqrt{1200 / CurrentCount} \times 0.95$.
  - Apply $S$ to `radius`, `width`, and `height`.

### 3. Structural Plumbing (Alignment)
- **Verticals**: Pillars and containers MUST have 0° Pitch and 0° Roll unless they are intentionally decorative debris.
- **Grounding**: The lowest points of any structure MUST be snapped to the `posY` (baseline) to avoid floating bases.

## Masterpiece Templates

### Prototypical Large Container (Trilithon)
```typescript
pts.push({ x, y: 6.0, z, yaw, pitch: 90, name: "land_container_1bo" }); // Pillar
pts.push({ x: lx, y: 12.2, z: lz, yaw: lyaw, name: "land_container_1bo" }); // Lintel
```

## Auditing Rules (Geometry Auditor)
- [ ] No gaps $> 0.1m$ between consecutive panels.
- [ ] Object count $\le 1200$.
- [ ] Vertical elements are 90° or 0° relative to ground.
