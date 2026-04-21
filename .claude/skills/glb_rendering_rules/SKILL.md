# 🎮 GLB RENDERING RULES — When to Use GLB vs BoxGeometry

**When to use:** Any time you add a new object type, suspect a rendering issue, or touch Preview3D.tsx.

---

## HOW THE RENDERER DECIDES WHAT TO DRAW

```
availableGlbs.has(name) && !name.includes("container")
  → InstancedGroup  (loads .glb from public/models/)
  → actual DayZ mesh, textures from real extracted PNGs

else
  → InstancedBoxes  (THREE.BoxGeometry using mimic.w × mimic.h × mimic.d)
  → solid coloured box, always fully visible from all sides
```

## KNOWN HOLLOW GLB OBJECTS — force to BoxGeometry

| Object | Problem | Fix in Preview3D.tsx |
|---|---|---|
| `land_container_*` | Real container GLB has open sides / single-sided normals → hollow from the side | `!name.includes("container")` already in condition |

**Rule:** If a GLB object appears hollow or missing faces in the preview, add `&& !name.includes("your_type")` to the GLB condition. The BoxGeometry fallback always renders solid.

---

## ADDING NEW OBJECT TYPES TO THE RENDERER

If a new object type (barrels, containers, pipes) renders wrong:

1. Check `getMaterialProps()` — does it match a texture branch? If not, add one.
2. Check `getMimic()` — does it have correct w/h/d dimensions?
3. If GLB exists but looks wrong → exclude from GLB path with the condition above.
4. If no GLB → `InstancedBoxes` handles it automatically with the mimic dimensions.

---

## MATERIAL TEXTURE BRANCHES (getMaterialProps)

| Classname contains | Texture |
|---|---|
| `container`, `tank` | `container_co.png` |
| `barrel` | `barrel_blue/green/red_co.png` |
| `stone`, `castle` | `stone_co.png` |
| `concrete`, `cnc`, `mil` | `milcnc_co.png` |
| `metal`, `tin` | `metal_co.png` |
| `brick` | `brick_co.png` |
| `pipe` | `pipe_co.png` |
| (default) | `concrete_wall_co.png` |
