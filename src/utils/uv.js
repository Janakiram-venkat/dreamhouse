// World-space box UVs: 1 UV unit = 1 metre on every face, whatever the mesh size (CLAUDE.md §6).
export function applyWorldBoxUV(geometry) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
    if (ny >= nx && ny >= nz) uv.setXY(i, px, -pz);
    else if (nx >= nz) uv.setXY(i, pz * Math.sign(nor.getX(i) || 1) * -1, py);
    else uv.setXY(i, px * Math.sign(nor.getZ(i) || 1), py);
  }
  uv.needsUpdate = true;
  return geometry;
}
