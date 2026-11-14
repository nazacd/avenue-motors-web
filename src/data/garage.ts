// The cars that stand in the 3D garage. Each model file in public/models is produced
// from a source model in source/models by scripts/build-model.mjs.
export type GarageCar = {
  // Matches a car in inventory.json, so the garage can show its name and price.
  slug: string;
  model: string;
  // Which set of rules in the garage scene turns this model's parts into paint, glass,
  // chrome and lamps. Every model is built differently, so each has its own.
  recipe: "maybach" | "g63" | "m4cs" | "flyingSpur";
  // The real car's length in metres. Models come in all sorts of units.
  length: number;
  // How far to turn the model so that its nose points down the negative X axis.
  yaw: number;
  // The colour of the car that is actually in stock.
  paint: string;
};

export const garageCars: GarageCar[] = [
  { slug: "mercedes-maybach-s680", model: "/models/maybach-s680.glb", recipe: "maybach", length: 5.47, yaw: 0, paint: "#040405" },
  { slug: "mercedes-amg-g63", model: "/models/g63.glb", recipe: "g63", length: 4.87, yaw: -Math.PI / 2, paint: "#040405" },
  { slug: "bmw-m4-cs-2024", model: "/models/m4-cs.glb", recipe: "m4cs", length: 4.8, yaw: -Math.PI / 2, paint: "#1c8fdc" },
  { slug: "bentley-flying-spur-speed-2023", model: "/models/flying-spur.glb", recipe: "flyingSpur", length: 5.32, yaw: 0, paint: "#040405" },
];

export type PaintKey = "black" | "graphite" | "white" | "green" | "red" | "blue";

// Preview colours offered beside the car's own.
export const paints: { key: PaintKey; color: string }[] = [
  { key: "black", color: "#040405" },
  { key: "graphite", color: "#3a3d42" },
  { key: "white", color: "#d9d9d4" },
  { key: "green", color: "#0c2f25" },
  { key: "red", color: "#4a0c15" },
  { key: "blue", color: "#0b1a33" },
];
