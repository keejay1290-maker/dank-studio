# ✅ GENERATOR REWORK CHECKLIST

**When to use:** Every time you rework or create a generator. Run through this before writing code.

---

## BEFORE WRITING ANY CODE

1. **Research the real building** — dimensions, distinctive features, proportions.
   - Height, width, depth in metres.
   - Key visual elements that make it instantly recognisable.
   - Don't guess — wrong proportions = unrecognisable build.

2. **Pick correct panel for each element:**
   - Castle/gothic walls → CASTLE (8×2m), step `2*S`
   - Light stone → STONE2 (9.408×1.572m), step `1.572*S`
   - Dark stone → STONE (10.060×2.034m), step `2*S`
   - Concrete → CNC4 (4.017×2.324m) or CNC8 (8.008×2.3m), step `2.3*S`
   - Military/structural → MILCNC (4.052×4.744m), step `4.5*S` at thin shafts
   - Industrial large → IND10 (9.012×9.758m), step `9.5*S` at large radius

3. **Check the step size** using `flush_panel_coverage` skill — wrong step = gaps.

---

## WHILE WRITING

4. **No diagonal drawWall for legs/columns.** Use stacked panels instead:
   ```ts
   for (let y = 0; y < legH; y += panelH * S) {
     const r = lerp(rBase, rTop, y / legH) * S;
     pts.push({ x: cos(a)*r, y, z: sin(a)*r, yaw: 90 - a*180/π, name: mat });
   }
   ```

5. **Arch/shell panels need yaw+pitch**, not just `yaw:0`. Use `panel_orientation_math` skill.

6. **Cap with `return applyLimit(pts, 1100)`** — never return raw array from a generator.

7. **Param key in generator must exactly match** `p.xxx` and the `key` in builds.ts — mismatch silences sliders silently.

---

## AFTER WRITING

8. **Add description** to builds.ts entry — one sentence, covers key facts (location, year, distinctive features).

9. **Run `npx tsc --noEmit`** — zero errors/warnings before declaring done.

10. **Check default scale** — at default scale the build should fit nicely. Lower if it hits the object limit or looks oversized.

---

## COMMON MISTAKES THIS WEEK

| Bug | Cause | Fix |
|---|---|---|
| Gaps in rings | Step size > effective panel height | Use flush_panel_coverage table |
| Flat-looking arch | All panels `yaw:0` | Compute yaw+pitch per rib position |
| Legs look broken | Diagonal drawWall with 3D endpoints | Stacked vertical panels per height |
| Hollow containers in preview | Container GLB has open sides | Exclude from GLB path in Preview3D.tsx |
| Sliders do nothing | Param key mismatch | `p.scale` must match `key: "scale"` in builds.ts |
| Build invisible | `applyLimit` called on sphere output | Never call applyLimit on drawSphere/drawDome output |
