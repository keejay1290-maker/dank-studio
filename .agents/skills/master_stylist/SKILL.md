# 🏛️ MASTER STYLIST SKILL (V1.0)
# Enforcing Cinematic Realism & Structural Logic

## 🕌 STYLE: THE GOTHIC CATHEDRAL
- **Principle**: *Ad Quadratum* (Proportions derived from nested squares).
- **Tracery**: Arches MUST use 4-point geometric construction (Pointed/Ogee Arches).
- **Flying Buttresses**: Must align to the vaulting load-bearing points (sinusoidal lateral projection).

## 🏙️ STYLE: ART DECO / FUTURISM
- **Principle**: **Ziggurat Setbacks**. Vertical towers must decrease in width exponentially at 30%, 60%, and 85% height.
- **Lighting**: Neon conduits (`staticobj_wall_indcnc_10` with blue/glow offsets).

## 🏚️ STYLE: THE ANCIENT RUIN
- **Principle**: **Stochastic Decay**. 
- Use the **Erosion Function**: `if (Noise(x,y,z) > threshold) skip_point();`
- **Rubble Logic**: Debris piles at base must match the volume of missing upper-tier blocks.

## 📐 MATHEMATICAL PRECISION (MATH.JS UPGRADE)
- **Rotations**: Use Quaternions for non-orthogonal tilting.
- **Density**: `nPanels = Math.ceil(ArcLength / ObjectWidth)`.
