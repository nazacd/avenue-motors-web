// Turns a source car model (.obj with its .mtl beside it) into the small compressed
// file the 3D garage loads.
//
//   node scripts/build-model.mjs <source.obj> <public/models/name.glb>
//
// The source is usually millions of triangles and hundreds of megabytes; the result is
// a few megabytes. Material names are kept, because the garage decides what each part
// is (paint, glass, chrome, lamps, plates) from its material name.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";

const [source, output] = process.argv.slice(2);
if (!source || !output) {
  console.error("Usage: node scripts/build-model.mjs <source.obj> <output.glb>");
  process.exit(1);
}

const work = mkdtempSync(path.join(tmpdir(), "model-"));
const step = (name) => path.join(work, `${name}.glb`);
const run = (tool, args) => execFileSync("npx", [tool, ...args], { stdio: ["ignore", "ignore", "inherit"] });

run("obj2gltf", ["-i", source, "-o", step("raw")]);

// Drop stray helper boxes that some models ship with, and nudge every material's colour
// apart so the later steps do not merge materials that happen to share the same values.
const io = new NodeIO();
const document = await io.read(step("raw"));
for (const node of document.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (mesh && /^Cube/.test(mesh.getName() || node.getName())) {
    node.setMesh(null);
    mesh.dispose();
  }
}
document.getRoot().listMaterials().forEach((material, i) => {
  const [r, g, b, a] = material.getBaseColorFactor();
  const nudge = (i + 1) * 0.002;
  material.setBaseColorFactor([r > 0.5 ? r - nudge : r + nudge, g, b, a]);
});
await io.write(step("named"), document);

run("gltf-transform", ["weld", step("named"), step("welded")]);
// Keep about an eighth of the triangles, without moving the surface by more than 0.05%.
run("gltf-transform", ["simplify", step("welded"), step("simple"), "--ratio", "0.12", "--error", "0.0005"]);
run("gltf-transform", ["join", step("simple"), step("joined")]);
run("gltf-transform", ["prune", step("joined"), step("pruned")]);
run("gltf-transform", ["meshopt", step("pruned"), output]);

rmSync(work, { recursive: true, force: true });
console.log(`${output}: ${(statSync(output).size / 1e6).toFixed(2)} MB`);
console.log(document.getRoot().listMaterials().map((material) => material.getName()).join(", "));
