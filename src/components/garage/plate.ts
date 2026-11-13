import * as THREE from "three";

// The outline of the logo mark, in the same units as brand/avenue-mark.svg.
export const MARK = {
  width: 464.1,
  height: 271.5,
  outer: [
    [118.6, 0],
    [209, 144.2],
    [464.1, 52.9],
    [0, 271.5],
  ],
  hole: [
    [127.1, 93],
    [157.1, 157],
    [91.4, 179.5],
  ],
  foot: [
    [194.8, 216.4],
    [240, 196],
    [256, 224.4],
    [199.8, 224.4],
  ],
} as const;

function tracePolygon(ctx: CanvasRenderingContext2D, points: readonly (readonly number[])[]) {
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, color: string) {
  const scale = height / MARK.height;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  tracePolygon(ctx, MARK.outer);
  tracePolygon(ctx, MARK.hole);
  ctx.fill("evenodd");
  ctx.beginPath();
  tracePolygon(ctx, MARK.foot);
  ctx.fill();
  ctx.restore();
  return MARK.width * scale;
}

const FONT = '"Jost Variable", "Jost", Arial, sans-serif';

function texture(canvas: HTMLCanvasElement) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

// The showroom's dealer plate: black, with the yellow mark and the name in white.
export function plateTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1040;
  canvas.height = 224;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#070708";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#8d8d92";
  ctx.lineWidth = 6;
  ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);

  const markWidth = drawMark(ctx, 150, 46, 124, "#ffcc00");
  const left = 150 + markWidth * 0.62;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 104px ${FONT}`;
  ctx.fillText("AVENUE", left, 132);
  const wide = ctx.measureText("AVENUE").width;
  ctx.font = `600 40px ${FONT}`;
  ctx.textAlign = "right";
  // Canvas letter spacing is not available everywhere, so the letters are set one by one.
  let x = left + wide;
  for (const letter of "MOTORS".split("").reverse()) {
    ctx.fillText(letter, x, 184);
    x -= ctx.measureText(letter).width + 13;
  }
  return texture(canvas);
}

// The wordmark of the wall sign, drawn as glowing white letters on a clear background.
export function wordmarkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(190, 205, 255, 0.9)";
  ctx.shadowBlur = 46;
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 430px ${FONT}`;
  ctx.fillText("AVENUE", 60, 430);
  const wide = ctx.measureText("AVENUE").width;
  ctx.font = `600 170px ${FONT}`;
  ctx.textAlign = "right";
  let x = 60 + wide;
  for (const letter of "MOTORS".split("").reverse()) {
    ctx.fillText(letter, x, 660);
    x -= ctx.measureText(letter).width + 52;
  }
  return { map: texture(canvas), aspect: canvas.width / canvas.height };
}

// The mark as a flat shape, one unit tall, for extruding into the wall sign.
export function markShapes() {
  const scale = 1 / MARK.height;
  const point = ([x, y]: readonly number[]) => new THREE.Vector2(x * scale, (MARK.height - y) * scale);
  const body = new THREE.Shape(MARK.outer.map(point));
  body.holes.push(new THREE.Path(MARK.hole.map(point)));
  const foot = new THREE.Shape(MARK.foot.map(point));
  return { shapes: [body, foot], width: MARK.width * scale };
}
