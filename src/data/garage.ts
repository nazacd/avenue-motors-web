// The cars that stand in the 3D garage. Each model file is produced from a source
// model in source/models: reduced to a few megabytes and compressed.
export type GarageCar = {
  // Matches a car in inventory.json, so the garage can show its name and price.
  slug: string;
  model: string;
};

export const garageCars: GarageCar[] = [{ slug: "mercedes-maybach-s680", model: "/models/maybach-s680.glb" }];

export type PaintKey = "black" | "graphite" | "white" | "green" | "red" | "blue";

export const paints: { key: PaintKey; color: string }[] = [
  { key: "black", color: "#040405" },
  { key: "graphite", color: "#3a3d42" },
  { key: "white", color: "#d9d9d4" },
  { key: "green", color: "#0c2f25" },
  { key: "red", color: "#4a0c15" },
  { key: "blue", color: "#0b1a33" },
];
