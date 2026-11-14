import * as THREE from "three";

// Surfaces of the hall, drawn on a canvas so the garage needs no image files.

// A repeatable random number, so the floor looks the same on every visit.
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function canvasOf(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function repeating(canvas: HTMLCanvasElement, repeat: number, colour: boolean) {
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.anisotropy = 8;
  if (colour) map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

// Polished stone tiles, four to a side, each a touch different from its neighbours.
// One map carries the colour and another how glossy each spot is: the tiles shine and
// the joints between them do not.
export function tileMaps(repeat: number) {
  const size = 1024;
  const tiles = 4;
  const step = size / tiles;
  const colour = canvasOf(size);
  const gloss = canvasOf(size);
  const random = seeded(7);

  for (let row = 0; row < tiles; row += 1) {
    for (let column = 0; column < tiles; column += 1) {
      const shade = 62 + Math.round(random() * 16);
      colour.ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 3})`;
      colour.ctx.fillRect(column * step, row * step, step, step);
      const rough = 44 + Math.round(random() * 34);
      gloss.ctx.fillStyle = `rgb(${rough}, ${rough}, ${rough})`;
      gloss.ctx.fillRect(column * step, row * step, step, step);
    }
  }
  // Faint wear, so reflections break up the way they do on a real floor.
  for (let i = 0; i < 260; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 20 + random() * 90;
    const wear = gloss.ctx.createRadialGradient(x, y, 0, x, y, radius);
    wear.addColorStop(0, `rgba(255, 255, 255, ${0.03 + random() * 0.05})`);
    wear.addColorStop(1, "rgba(255, 255, 255, 0)");
    gloss.ctx.fillStyle = wear;
    gloss.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  for (let line = 0; line <= tiles; line += 1) {
    const at = Math.min(line * step, size - 3);
    colour.ctx.fillStyle = "#101012";
    colour.ctx.fillRect(at, 0, 3, size);
    colour.ctx.fillRect(0, at, size, 3);
    gloss.ctx.fillStyle = "#e6e6e6";
    gloss.ctx.fillRect(at, 0, 3, size);
    gloss.ctx.fillRect(0, at, size, 3);
  }
  return { map: repeating(colour.canvas, repeat, true), roughnessMap: repeating(gloss.canvas, repeat, false) };
}

// Dark wall panels with thin joints between them.
export function panelMap(repeatX: number, repeatY: number) {
  const size = 512;
  const { canvas, ctx } = canvasOf(size);
  const random = seeded(23);
  ctx.fillStyle = "#2a2b30";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i += 1) {
    const light = random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${light}, ${light}, ${light}, ${random() * 0.035})`;
    ctx.fillRect(random() * size, random() * size, 2 + random() * 40, 1 + random() * 3);
  }
  ctx.fillStyle = "#141518";
  ctx.fillRect(0, 0, 4, size);
  ctx.fillRect(0, 0, size, 3);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}
