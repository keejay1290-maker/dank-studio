import { gen_atat_walker } from "./src/lib/generators/shapes.js";
const pts = gen_atat_walker({ scale: 1 });
let hasNan = false;
for (const p of pts) {
    if (isNaN(p.x) || isNaN(p.y) || isNaN(p.z) || (p.yaw !== undefined && isNaN(p.yaw)) || (p.pitch !== undefined && isNaN(p.pitch))) {
        console.log("NaN FOUND:", p);
        hasNan = true;
    }
}
if (!hasNan) console.log("No NaNs found!");
