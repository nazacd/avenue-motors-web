"use client";

import { ContactShadows, Environment, MeshReflectorMaterial, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { GarageCar, GarageView } from "@/data/garage";
import { markShapes, plateTexture, wordmarkTexture } from "./plate";
import { panelMap, tileMaps } from "./room";

type SceneProps = {
  car: GarageCar;
  paint: string;
  lights: boolean;
  view: GarageView;
  // Called once the car is on the turntable, so the page can lift the curtain.
  onReady: () => void;
};

const BLACK = "#050506";

// ───────── The car ─────────

// What the page can change on a car once it is set up.
type Controls = { setPaint: (color: string) => void; setLights: (on: boolean) => void };
type Prepared = { holder: THREE.Group; controls: Controls };

function paintMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: BLACK,
    metalness: 0.86,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.35,
  });
}

const standard = (params: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(params);

// How strongly tail lamps glow. The whole picture is tone-mapped at the end, and a red
// pushed much past full brightness washes out to orange, so these stay modest.
const TAIL_ON = 1.15;
const TAIL_OFF = 0.1;
const lamp = (color: string, emissive: string) => standard({ color, emissive, emissiveIntensity: 0, toneMapped: false });

// Dark privacy glass. Real glass that bends light costs phones a second render of the
// whole scene, so every car gets this instead.
function darkGlass(opacity = 0.93) {
  return new THREE.MeshPhysicalMaterial({
    color: "#030405",
    metalness: 0.2,
    roughness: 0.03,
    transparent: true,
    opacity,
    envMapIntensity: 1.6,
  });
}

function meshesOf(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  root.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh);
  });
  return meshes;
}

const nameOf = (mesh: THREE.Mesh) => (mesh.material as THREE.Material).name;

// Puts a model into the garage's own terms: real size in metres, nose down the
// negative X axis, centred, wheels on the ground.
function fit(scene: THREE.Object3D, car: GarageCar) {
  const holder = new THREE.Group();
  const turned = new THREE.Group();
  turned.rotation.y = car.yaw;
  turned.add(scene);
  holder.add(turned);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder);
  const scale = car.length / (box.max.x - box.min.x);
  turned.scale.setScalar(scale);
  turned.position.set((-(box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, (-(box.min.z + box.max.z) / 2) * scale);
  holder.updateMatrixWorld(true);
  return holder;
}

// Splits one mesh in two by where each triangle sits. Used to give the Maybach's
// headlamp covers clear glass while its windows, which share their material, stay dark.
function splitByTriangle(mesh: THREE.Mesh, isFirst: (centre: THREE.Vector3) => boolean) {
  const { geometry } = mesh;
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex()!;
  const first: number[] = [];
  const second: number[] = [];
  const corner = new THREE.Vector3();
  const centre = new THREE.Vector3();
  for (let i = 0; i < index.count; i += 3) {
    centre.set(0, 0, 0);
    for (let k = 0; k < 3; k += 1) {
      centre.add(corner.fromBufferAttribute(position, index.getX(i + k)));
    }
    centre.divideScalar(3).applyMatrix4(mesh.matrixWorld);
    const target = isFirst(centre) ? first : second;
    target.push(index.getX(i), index.getX(i + 1), index.getX(i + 2));
  }
  const rest = geometry.clone();
  geometry.setIndex(first);
  rest.setIndex(second);
  const other = new THREE.Mesh(rest);
  mesh.parent?.add(other);
  other.position.copy(mesh.position);
  other.quaternion.copy(mesh.quaternion);
  other.scale.copy(mesh.scale);
  other.updateMatrixWorld(true);
  return other;
}

const PLATE = { width: 0.52, height: 0.112 };

function plateMesh(map: THREE.Texture, width = PLATE.width) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / (PLATE.width / PLATE.height)),
    standard({ map, roughness: 0.45, metalness: 0.1 }),
  );
}

// Lays a dealer plate over the model's own plate at one end of the car, found from
// the meshes that make up that plate.
function plateOverMeshes(holder: THREE.Group, meshes: THREE.Mesh[], end: "front" | "rear", map: THREE.Texture) {
  const point = new THREE.Vector3();
  const box = new THREE.Box3();
  const points: THREE.Vector3[] = [];
  for (const mesh of meshes) {
    const position = mesh.geometry.getAttribute("position");
    for (let i = 0; i < position.count; i += 1) {
      point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      if ((end === "front") === point.x < 0) {
        points.push(point.clone());
        box.expandByPoint(point);
      }
    }
  }
  if (points.length === 0) return;

  const middle = (box.min.y + box.max.y) / 2;
  const mean = (list: THREE.Vector3[]) => list.reduce((sum, p) => sum + p.x, 0) / Math.max(list.length, 1);
  // How far the plate leans, read from its top edge sitting further in than its bottom.
  const lean = Math.atan2(mean(points.filter((p) => p.y > middle)) - mean(points.filter((p) => p.y <= middle)), (box.max.y - box.min.y) / 2);
  const outward = end === "front" ? -1 : 1;
  const plate = plateMesh(map, Math.min((box.max.z - box.min.z) * 0.96, PLATE.width));
  plate.position.set((end === "front" ? box.min.x : box.max.x) + outward * 0.012, middle, (box.min.z + box.max.z) / 2);
  plate.rotation.set(0, (outward * Math.PI) / 2, 0);
  plate.rotateX(lean);
  holder.add(plate);
}

// For a model with no plate of its own: finds the bodywork on the centre line at the
// given height and fixes a dealer plate to it.
function plateByRay(holder: THREE.Group, end: "front" | "rear", height: number, map: THREE.Texture) {
  const outward = end === "front" ? -1 : 1;
  const ray = new THREE.Raycaster(new THREE.Vector3(outward * 10, height, 0), new THREE.Vector3(-outward, 0, 0));
  const hit = ray.intersectObject(holder, true)[0];
  if (!hit) return;
  const plate = plateMesh(map);
  plate.position.copy(hit.point).add(new THREE.Vector3(outward * 0.014, 0, 0));
  plate.rotation.set(0, (outward * Math.PI) / 2, 0);
  holder.add(plate);
}

// The Maybach arrives with bare, untextured materials, so every part is given a
// material here, chosen by the name its material has in the file.
const MAYBACH = {
  paint: ["Car_Paint_With_Flakes", "Car_paint", "Car_Paint"],
  chrome: ["Car_chrome", "Material.006", "Car_Paint.001", "Material_#2125663081", "Material_#2125663085"],
  brakes: ["Material_#2125663092", "Material_#2125663093"],
  gloss: ["Material_#2125663075", "Material_#2125663077"],
  redGlass: ["Red_car_lights_glass"],
  tail: ["Material.001", "Material_#2125663089", "Material_#2125663074"],
  day: ["Material_#2125663076"],
  plates: ["Material_#2125663072", "Material_#2125663073"],
};

function maybach(holder: THREE.Group): Controls {
  const paint = paintMaterial();
  const day = lamp("#ffffff", "#e4ecff");
  const tail = lamp("#2a0003", "#ff0a12");
  const plastic = standard({ color: "#08080a", roughness: 0.6 });
  const byName = new Map<string, THREE.Material>();
  const assign = (names: string[], material: THREE.Material) => names.forEach((name) => byName.set(name, material));
  assign(MAYBACH.paint, paint);
  assign(MAYBACH.chrome, standard({ color: "#f4f4f4", metalness: 1, roughness: 0.07 }));
  assign(MAYBACH.brakes, standard({ color: "#5c5c61", metalness: 1, roughness: 0.38 }));
  assign(MAYBACH.gloss, standard({ color: "#060607", metalness: 0.3, roughness: 0.16 }));
  assign(MAYBACH.redGlass, new THREE.MeshPhysicalMaterial({ color: "#8a0010", roughness: 0.05, transparent: true, opacity: 0.72 }));
  assign(MAYBACH.tail, tail);
  assign(MAYBACH.day, day);

  const plate = plateTexture();
  for (const mesh of meshesOf(holder)) {
    const name = nameOf(mesh);
    mesh.material = byName.get(name) ?? plastic;
    if (name === "Glass") {
      // The model has no cabin, so the windows are dark; the lamp covers are clear.
      const windows = splitByTriangle(mesh, (centre) => centre.x < -1.95 && centre.y < 0.9);
      mesh.material = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0, transparent: true, opacity: 0.2 });
      windows.material = darkGlass();
    }
    if (name === MAYBACH.plates[0]) {
      plateOverMeshes(holder, [mesh], "front", plate);
      plateOverMeshes(holder, [mesh], "rear", plate);
    }
  }
  return {
    setPaint: (color) => paint.color.set(color),
    setLights: (on) => {
      day.emissiveIntensity = on ? 5 : 0;
      tail.emissiveIntensity = on ? TAIL_ON : TAIL_OFF;
    },
  };
}

// The G 63 comes fully finished, in red with bright trim. The car in stock is black
// throughout: paint, grille, trim and wheels.
function g63(holder: THREE.Group): Controls {
  const paint = paintMaterial();
  const day = lamp("#ffffff", "#e4ecff");
  const tail = lamp("#3a0004", "#ff0a12");
  const blackTrim = standard({ color: "#0b0b0c", metalness: 0.9, roughness: 0.22 });
  // The headlamp covers share the windows' naming, but must stay clear to show the lamps.
  const clearLens = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0, transparent: true, opacity: 0.18 });
  const plates: THREE.Mesh[] = [];
  for (const mesh of meshesOf(holder)) {
    const name = nameOf(mesh);
    if (name === "bodypaint") mesh.material = paint;
    else if (name === "AMG_silver" || name === "G-class_speedo_black") mesh.material = blackTrim;
    else if (name === "G-class_lightled") mesh.material = day;
    else if (name === "G-class_taillight_1") mesh.material = tail;
    else if (name === "G-class_glass.004") mesh.material = clearLens;
    else if (/glass|IntWindows/i.test(name)) mesh.material = darkGlass(0.72);
    else if (name === "amg_texture5") {
      mesh.material = standard({ color: "#08080a", roughness: 0.6 });
      plates.push(mesh);
    }
  }
  const plate = plateTexture();
  plateOverMeshes(holder, plates, "front", plate);
  plateOverMeshes(holder, plates, "rear", plate);
  return {
    setPaint: (color) => paint.color.set(color),
    setLights: (on) => {
      day.emissiveIntensity = on ? 5 : 0;
      tail.emissiveIntensity = on ? TAIL_ON : TAIL_OFF;
    },
  };
}

// The M4 CS has its green paint painted into three textures, together with carbon and
// trim that must stay as they are. Changing colour repaints only the green.
function m4cs(holder: THREE.Group): Controls {
  const painted: { material: THREE.MeshStandardMaterial; source: CanvasImageSource; width: number; height: number }[] = [];
  let day: THREE.MeshStandardMaterial | undefined;
  const tail = lamp("#3a0004", "#ff0a12");
  for (const mesh of meshesOf(holder)) {
    const name = nameOf(mesh);
    const material = mesh.material as THREE.MeshPhysicalMaterial;
    if (/^m4car_(body1|hood1|bodykit1)/.test(name) && material.map && !painted.some((entry) => entry.material === material)) {
      const image = material.map.image as { width: number; height: number };
      painted.push({ material, source: image as CanvasImageSource, width: image.width, height: image.height });
      material.clearcoat = 1;
      material.clearcoatRoughness = 0.05;
    } else if (name.startsWith("m4car_emissive1")) {
      day = material;
    } else if (name.includes("LightA_Material")) {
      mesh.material = tail;
    } else if (name.startsWith("m4car_glass1")) {
      material.transmission = 0;
      material.transparent = true;
      material.opacity = 0.7;
    }
  }
  const plate = plateTexture();
  plateByRay(holder, "front", 0.33, plate);
  plateByRay(holder, "rear", 0.6, plate);

  const target = new THREE.Color();
  return {
    setPaint: (color) => {
      target.set(color).convertLinearToSRGB();
      for (const entry of painted) {
        const canvas = document.createElement("canvas");
        canvas.width = entry.width;
        canvas.height = entry.height;
        const context = canvas.getContext("2d", { willReadFrequently: true })!;
        context.drawImage(entry.source, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = pixels.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // The model's own paint is a sea green. Anything else is carbon or trim.
          if (g > r * 1.25 && b > r * 1.1 && Math.abs(g - b) < g * 0.4) {
            const shade = Math.min(g / 143, 1.5);
            data[i] = Math.min(255, target.r * 255 * shade);
            data[i + 1] = Math.min(255, target.g * 255 * shade);
            data[i + 2] = Math.min(255, target.b * 255 * shade);
          }
        }
        context.putImageData(pixels, 0, 0);
        const previous = entry.material.map!;
        const map = new THREE.CanvasTexture(canvas);
        map.flipY = false;
        map.colorSpace = THREE.SRGBColorSpace;
        map.wrapS = previous.wrapS;
        map.wrapT = previous.wrapT;
        map.channel = previous.channel;
        map.anisotropy = 4;
        entry.material.map = map;
        entry.material.needsUpdate = true;
      }
    },
    setLights: (on) => {
      if (day) day.emissiveIntensity = on ? 3 : 0;
      tail.emissiveIntensity = on ? TAIL_ON : TAIL_OFF;
    },
  };
}

// The Flying Spur arrives as 29 parts that all share one blank material. This says what
// each part is. The car in stock is the dark-trim Speed: black grille, trim and wheels,
// with an orange interior.
// The Flying Spur arrives with one material for the whole car, so each part is named
// here. "Object_21" and "Object_29" mix several things and are divided by position.
const FLYING_SPUR: Record<string, string> = {
  Object_4: "paint", Object_28: "paint",
  Object_26: "glass",
  Object_2: "wheel", Object_24: "wheel",
  Object_15: "tyre", Object_16: "tyre", Object_20: "tyre", Object_22: "tyre", Object_23: "tyre",
  Object_6: "trim", Object_9: "trim", Object_10: "trim", Object_11: "trim",
  Object_13: "trim", Object_14: "trim", Object_27: "trim",
  Object_12: "chrome",
  Object_17: "day",
  Object_25: "calipers",
  Object_3: "leather",
};

function flyingSpur(holder: THREE.Group): Controls {
  const paint = paintMaterial();
  const day = lamp("#ffffff", "#e4ecff");
  const tail = lamp("#3a0004", "#ff0a12");
  const leather = standard({ color: "#c2581a", roughness: 0.6 });
  const plastic = standard({ color: "#0b0b0c", roughness: 0.6 });
  const materials: Record<string, THREE.Material> = {
    paint,
    day,
    leather,
    glass: darkGlass(0.8),
    // The car in stock has the black pack: grille, trim and wheels are all gloss black.
    wheel: standard({ color: "#0a0a0b", metalness: 0.9, roughness: 0.28 }),
    tyre: standard({ color: "#0a0a0a", roughness: 0.85 }),
    trim: standard({ color: "#0c0c0d", metalness: 1, roughness: 0.16 }),
    chrome: standard({ color: "#f4f4f4", metalness: 1, roughness: 0.08 }),
    calipers: standard({ color: "#d4581a", roughness: 0.4 }),
  };
  const isTailLamp = (at: THREE.Vector3) => at.x > 2.18 && at.y > 0.66 && at.y < 0.97 && Math.abs(at.z) > 0.5;
  const isHeadLamp = (at: THREE.Vector3) => at.x < -2.12 && at.y > 0.57 && at.y < 0.82 && Math.abs(at.z) > 0.5;
  for (const mesh of meshesOf(holder)) {
    mesh.material = materials[FLYING_SPUR[mesh.name] ?? ""] ?? plastic;
    if (mesh.name === "Object_6") {
      // Trim, with the lamp covers at both ends attached. Left as trim they hide the lamps:
      // the front ones are lit, the rear ones are red glass over the lit shapes behind.
      const notHeadLamps = splitByTriangle(mesh, isHeadLamp);
      mesh.material = day;
      const trim = splitByTriangle(notHeadLamps, isTailLamp);
      notHeadLamps.material = new THREE.MeshPhysicalMaterial({ color: "#5a000c", roughness: 0.08, transparent: true, opacity: 0.2 });
      trim.material = materials.trim;
    }
    if (mesh.name === "Object_26") {
      const windows = splitByTriangle(mesh, isHeadLamp);
      mesh.material = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0, transparent: true, opacity: 0.15 });
      windows.material = materials.glass;
    }
    if (mesh.name === "Object_29") {
      // The cabin lining, with the tail lamp lenses attached.
      const cabin = splitByTriangle(mesh, isTailLamp);
      mesh.material = tail;
      cabin.material = plastic;
    }
    if (mesh.name === "Object_21") {
      // Glass roof, tail lamp insides, steering wheel and wheel-arch liners in one part.
      const belowRoof = splitByTriangle(mesh, (at) => at.y > 1.28);
      mesh.material = standard({ color: "#040405", metalness: 0.4, roughness: 0.06, envMapIntensity: 1.4 });
      const notLamps = splitByTriangle(belowRoof, isTailLamp);
      belowRoof.material = tail;
      const liners = splitByTriangle(
        notLamps,
        (at) => at.x > -0.84 && at.x < -0.44 && at.y > 0.62 && at.y < 1.18 && at.z > 0.14 && at.z < 0.76,
      );
      notLamps.material = leather;
      liners.material = plastic;
    }
  }
  const plate = plateTexture();
  plateByRay(holder, "front", 0.3, plate);
  plateByRay(holder, "rear", 0.5, plate);
  // The model has nothing between the engine bay and the cabin, so the seats showed
  // through the grille. A black wall under the bonnet closes it off.
  const bulkhead = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.8),
    new THREE.MeshBasicMaterial({ color: "#020203", side: THREE.DoubleSide }),
  );
  bulkhead.position.set(-1.55, 0.52, 0);
  bulkhead.rotation.y = Math.PI / 2;
  holder.add(bulkhead);
  return {
    setPaint: (color) => paint.color.set(color),
    setLights: (on) => {
      day.emissiveIntensity = on ? 4 : 0;
      tail.emissiveIntensity = on ? TAIL_ON : TAIL_OFF;
    },
  };
}

const RECIPES = { maybach, g63, m4cs, flyingSpur };

// What a car's lamps throw into the room: two pools of light on the floor ahead and a
// faint red glow behind.
function lampRig(holder: THREE.Group) {
  const box = new THREE.Box3().setFromObject(holder);
  const half = (box.max.z - box.min.z) / 2;
  const rig = new THREE.Group();
  const beams: THREE.SpotLight[] = [];
  for (const side of [-1, 1]) {
    const beam = new THREE.SpotLight("#dfe8ff", 0, 15, 0.46, 0.9, 1.7);
    beam.position.set(box.min.x + 0.3, 0.72, side * half * 0.62);
    beam.target.position.set(box.min.x - 7, -0.2, side * half * 0.85);
    rig.add(beam, beam.target);
    beams.push(beam);
  }
  const glow = new THREE.PointLight("#ff1a22", 0, 3.2, 2);
  glow.position.set(box.max.x + 0.9, 0.5, 0);
  rig.add(glow);
  holder.add(rig);
  return (on: boolean) => {
    beams.forEach((beam) => (beam.intensity = on ? 32 : 0));
    glow.intensity = on ? 1 : 0;
  };
}

// The loader hands back the same object for the same file, so each car is set up once.
const prepared = new WeakMap<THREE.Object3D, Prepared>();

function prepare(scene: THREE.Object3D, car: GarageCar, shadows: boolean) {
  let entry = prepared.get(scene);
  if (!entry) {
    const holder = fit(scene, car);
    const controls = RECIPES[car.recipe](holder);
    if (shadows) meshesOf(holder).forEach((mesh) => (mesh.castShadow = true));
    const setRig = lampRig(holder);
    entry = {
      holder,
      controls: {
        setPaint: controls.setPaint,
        setLights: (on) => {
          controls.setLights(on);
          setRig(on);
        },
      },
    };
    prepared.set(scene, entry);
  }
  return entry;
}

function Car({ car, paint, lights, onReady, shadows }: SceneProps & { shadows: boolean }) {
  const { scene } = useGLTF(car.model);
  const { holder, controls } = prepare(scene, car, shadows);

  // Braces matter here: an effect that returns a value hands React a "clean-up" that
  // is not a function, and the page falls over when the car is swapped.
  useEffect(() => {
    controls.setPaint(paint);
  }, [controls, paint]);
  useEffect(() => {
    controls.setLights(lights);
  }, [controls, lights]);

  useEffect(() => {
    onReady();
  }, [onReady, holder]);

  return <primitive object={holder} />;
}

// ───────── The room ─────────

// The hall, in metres. The turntable is at the origin and the sign wall behind it.
const HALL = { width: 28, back: -5.6, front: 17, height: 6.6 };
const RING = { radius: 3.05, height: 5.5 };
// Rows of ceiling tubes running from the sign wall toward the visitor.
const TUBE_ROWS = [-10.5, -7, -3.5, 3.5, 7, 10.5];

// Where the turntable stops for each view, as the angle of the car's nose. In "show"
// it keeps turning.
const TURN: Record<GarageView, number | null> = {
  show: null,
  front: Math.PI / 2,
  side: 0,
  rear: -Math.PI / 2 + 0.55,
  top: Math.PI / 2 - 0.6,
};

function Turntable({ view, children }: { view: GarageView; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const table = group.current;
    if (!table) return;
    const step = Math.min(delta, 0.05);
    const stop = TURN[view];
    if (stop === null) {
      table.rotation.y += step * 0.12;
      return;
    }
    // Turn the short way round to the stop.
    const gap = Math.atan2(Math.sin(stop - table.rotation.y), Math.cos(stop - table.rotation.y));
    table.rotation.y += gap * Math.min(1, step * 3.2);
  });
  return (
    <>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[3.35, 3.45, 0.12, 96]} />
        <meshStandardMaterial color="#0c0d0f" metalness={0.75} roughness={0.36} />
      </mesh>
      {/* A hairline of light around the foot of the turntable. */}
      <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.007, 8, 128]} />
        <meshBasicMaterial color={GLOW.warm} toneMapped={false} />
      </mesh>
      {/* Starts three-quarter on, nose toward the visitor. */}
      <group ref={group} position={[0, 0.12, 0]} rotation={[0, Math.PI / 2 - 0.6, 0]}>
        {children}
        <ContactShadows position={[0, 0.004, 0]} scale={9} far={1.6} blur={2.6} opacity={0.85} resolution={512} frames={1} />
      </group>
    </>
  );
}

// Colours brighter than white, so that the lamps of the hall bloom.
const GLOW = {
  warm: new THREE.Color("#fff1dc").multiplyScalar(1.15),
  tube: new THREE.Color("#eef3ff").multiplyScalar(2.1),
  ring: new THREE.Color("#fff6ea").multiplyScalar(3.2),
  red: new THREE.Color("#c1121f").multiplyScalar(1.6),
};

const SIGN_HEIGHT = 1.45;

function Sign() {
  const mark = useMemo(() => markShapes(), []);
  const word = useMemo(() => wordmarkTexture(), []);
  // Proportions measured from the official lockup, in units of the mark's height.
  const left = (-4.02 * SIGN_HEIGHT) / 2;
  const perPixel = (0.76 * SIGN_HEIGHT) / 531;
  const wordWidth = 768 * word.aspect * perPixel;
  const wordHeight = 768 * perPixel;

  return (
    <group position={[0, 2.95, HALL.back + 0.1]}>
      <mesh position={[left, -SIGN_HEIGHT / 2, 0]} scale={[SIGN_HEIGHT, SIGN_HEIGHT, 1]}>
        <extrudeGeometry args={[mark.shapes, { depth: 0.09, bevelEnabled: false }]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffb400" emissiveIntensity={1.5} roughness={0.45} />
      </mesh>
      <mesh
        position={[
          left + 1.71 * SIGN_HEIGHT - 60 * perPixel + wordWidth / 2,
          SIGN_HEIGHT / 2 - 0.18 * SIGN_HEIGHT + 129 * perPixel - wordHeight / 2,
          0.06,
        ]}
      >
        <planeGeometry args={[wordWidth, wordHeight]} />
        <meshBasicMaterial map={word.map} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Every ceiling tube is the same box, drawn in one go.
function Tubes() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => {
    const list: [number, number][] = [];
    for (const x of TUBE_ROWS) for (let z = HALL.back + 2; z < HALL.front - 1; z += 2.6) list.push([x, z]);
    return list;
  }, []);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const place = new THREE.Matrix4();
    spots.forEach(([x, z], i) => mesh.setMatrixAt(i, place.makeTranslation(x, HALL.height - 0.35, z)));
    mesh.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, spots.length]}>
      <boxGeometry args={[0.07, 0.04, 1.5]} />
      <meshBasicMaterial color={GLOW.tube} toneMapped={false} />
    </instancedMesh>
  );
}

function Room({ coarse }: { coarse: boolean }) {
  const tiles = useMemo(() => tileMaps(13), []);
  const panels = useMemo(() => panelMap(14, 3), []);
  const sidePanels = useMemo(() => panelMap(11, 3), []);
  const depth = HALL.front - HALL.back;
  const middle = (HALL.front + HALL.back) / 2;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <MeshReflectorMaterial
          resolution={coarse ? 512 : 1024}
          blur={[260, 70]}
          mixBlur={0.85}
          mixStrength={11}
          roughness={1}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#c4c5ca"
          metalness={0.3}
          map={tiles.map}
          roughnessMap={tiles.roughnessMap}
        />
      </mesh>

      {/* Sign wall, side walls, the wall behind the visitor and the ceiling. */}
      <mesh position={[0, HALL.height / 2, HALL.back]}>
        <planeGeometry args={[HALL.width, HALL.height]} />
        <meshStandardMaterial map={panels} roughness={0.92} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * HALL.width) / 2, HALL.height / 2, middle]} rotation={[0, (-side * Math.PI) / 2, 0]}>
          <planeGeometry args={[depth, HALL.height]} />
          <meshStandardMaterial map={sidePanels} color="#9a9a9e" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, HALL.height / 2, HALL.front]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[HALL.width, HALL.height]} />
        <meshStandardMaterial color="#0c0c0e" roughness={1} />
      </mesh>
      <mesh position={[0, HALL.height, middle]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HALL.width, depth]} />
        <meshStandardMaterial color="#060607" roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 9.6, HALL.height / 2, HALL.back + 2.2]}>
          <boxGeometry args={[0.5, HALL.height, 0.5]} />
          <meshStandardMaterial color="#17181b" roughness={0.8} />
        </mesh>
      ))}

      {/* The red skirting line of the real showroom. */}
      <mesh position={[0, 0.07, HALL.back + 0.02]}>
        <boxGeometry args={[HALL.width, 0.045, 0.02]} />
        <meshBasicMaterial color={GLOW.red} toneMapped={false} />
      </mesh>

      <Tubes />
      {/* The ring of light that hangs over the turntable. */}
      <mesh position={[0, RING.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING.radius, 0.035, 10, 128]} />
        <meshBasicMaterial color={GLOW.ring} toneMapped={false} />
      </mesh>
      <Sign />
    </>
  );
}

// A flat lamp for the reflection map only. Its colour runs brighter than white.
function Lamp({ color, strength, ...props }: { color: string; strength: number } & React.ComponentProps<"mesh">) {
  const tint = useMemo(() => new THREE.Color(color).multiplyScalar(strength), [color, strength]);
  return (
    <mesh {...props}>
      {props.children}
      <meshBasicMaterial color={tint} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// What the paint and chrome reflect: the ring, the rows of tubes and the sign. It is a
// dark room, so bodywork shows as lines of light on black, the way it does in the hall.
function Reflections() {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={["#020203"]} />
      <Lamp color="#fff6ea" strength={15} position={[0, RING.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RING.radius - 0.11, RING.radius + 0.11, 96]} />
      </Lamp>
      {TUBE_ROWS.map((x) => (
        <Lamp key={x} color="#eef3ff" strength={7} position={[x, HALL.height - 0.35, 5]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 21]} />
        </Lamp>
      ))}
      <Lamp color="#ffcc00" strength={2.4} position={[-1.8, 2.9, HALL.back]}>
        <planeGeometry args={[2.2, 1.4]} />
      </Lamp>
      <Lamp color="#e6ecff" strength={2.8} position={[1.3, 2.8, HALL.back]}>
        <planeGeometry args={[3.3, 0.7]} />
      </Lamp>
      {/* A low, soft glow from the open hall behind the visitor, to model the flanks. */}
      <Lamp color="#aab4c8" strength={0.13} position={[0, 2.2, 14]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[22, 3.4]} />
      </Lamp>
    </Environment>
  );
}

// ───────── The camera ─────────

type Pose = { azimuth: number; polar: number; distance: number };


const POSES: Record<GarageView, Pose> = {
  show: { azimuth: -0.3, polar: 1.512, distance: 10.2 },
  front: { azimuth: 0, polar: 1.525, distance: 9.2 },
  side: { azimuth: 0, polar: 1.512, distance: 10.6 },
  rear: { azimuth: 0.18, polar: 1.5, distance: 9.8 },
  top: { azimuth: -0.42, polar: 1.1, distance: 11.6 },
};

const UPRIGHT_REACH = 1.22;

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

// Flies the camera to each view, and sweeps it in when a car arrives. Between
// flights the visitor is free to drag and zoom.
function CameraRig({ view, token, upright }: { view: GarageView; token: string; upright: boolean }) {
  const camera = useThree((state) => state.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const flight = useRef<{ from: Pose; to: Pose; length: number; at: number } | null>(null);
  const seen = useRef<string | null>(null);
  // An upright screen sees a narrow slice of the room, so the camera stands further back.
  const reach = upright ? UPRIGHT_REACH : 1;
  // Aimed below the car's middle, which lifts the car clear of the words along the
  // bottom. A phone has more of them, and looking lower also keeps the ring of light
  // out of the top of the picture.
  const target = useMemo(() => new THREE.Vector3(0, upright ? 0.2 : 0.6, 0), [upright]);

  useEffect(() => {
    const to = { ...POSES[view], distance: POSES[view].distance * reach };
    if (seen.current !== token) {
      // A new car: come in low and wide of the mark.
      seen.current = token;
      flight.current = { from: { azimuth: to.azimuth - 0.5, polar: 1.535, distance: to.distance + 2.6 }, to, length: 2.6, at: 0 };
      return;
    }
    const offset = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
    flight.current = { from: { azimuth: offset.theta, polar: offset.phi, distance: offset.radius }, to, length: 1.3, at: 0 };
  }, [view, token, reach, camera, target]);

  useFrame((_, delta) => {
    const now = flight.current;
    const orbit = controls.current;
    if (!now || !orbit) return;
    now.at = Math.min(1, now.at + Math.min(delta, 0.05) / now.length);
    const t = ease(now.at);
    const mix = (from: number, to: number) => from + (to - from) * t;
    const offset = new THREE.Spherical(mix(now.from.distance, now.to.distance), mix(now.from.polar, now.to.polar), mix(now.from.azimuth, now.to.azimuth));
    camera.position.setFromSpherical(offset).add(target);
    orbit.enabled = now.at === 1;
    orbit.update();
    if (now.at === 1) flight.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      target={target}
      enablePan={false}
      enableDamping
      rotateSpeed={0.55}
      zoomSpeed={0.6}
      minDistance={5.8 * reach}
      maxDistance={12.5 * reach}
      minPolarAngle={0.7}
      maxPolarAngle={1.545}
      minAzimuthAngle={-1.7}
      maxAzimuthAngle={1.7}
    />
  );
}

// How far the model files have come down, for the loading bar on the curtain.
function Progress() {
  const progress = useProgress((state) => state.progress);
  return (
    <div className="garage__progress" aria-hidden>
      <span style={{ scale: `${Math.max(progress, 4) / 100} 1` }} />
    </div>
  );
}

export default function GarageScene(props: SceneProps) {
  const coarse = useMemo(() => window.matchMedia("(pointer: coarse)").matches, []);
  const upright = useMemo(() => window.innerHeight > window.innerWidth, []);
  const start = POSES.show.distance * (upright ? UPRIGHT_REACH : 1) + 2.6;

  return (
    <>
      <Canvas
        shadows={!coarse}
        dpr={[1, coarse ? 1.5 : 1.75]}
        camera={{ position: [-4.6, 1.3, start], fov: upright ? 50 : 30, near: 0.1, far: 80 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#020203"]} />
        <fog attach="fog" args={["#020203", 13, 30]} />
        <ambientLight intensity={0.07} />
        {/* The key light, straight down through the ring. */}
        <spotLight
          position={[0, RING.height + 0.6, 0.4]}
          angle={0.62}
          penumbra={1}
          intensity={105}
          distance={14}
          decay={1.7}
          color="#fff4e2"
          castShadow={!coarse}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-radius={5}
        />
        {/* Two washes on the sign wall. */}
        {[-1, 1].map((side) => (
          <WallWash key={side} side={side} />
        ))}
        <directionalLight position={[-7, 3, 8]} intensity={0.16} color="#b8c4de" />
        <Reflections />
        <Room coarse={coarse} />
        <Turntable view={props.view}>
          <Suspense fallback={null}>
            <Car key={props.car.model} {...props} shadows={!coarse} />
          </Suspense>
        </Turntable>
        <CameraRig view={props.view} token={props.car.model} upright={upright} />
        <EffectComposer multisampling={coarse ? 0 : 4} enableNormalPass={false}>
          <Bloom mipmapBlur intensity={0.5} luminanceThreshold={1} luminanceSmoothing={0.2} radius={0.72} />
          <Vignette offset={0.26} darkness={0.74} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
      <Progress />
    </>
  );
}

function WallWash({ side }: { side: number }) {
  const light = useRef<THREE.SpotLight>(null);
  useEffect(() => {
    const lamp = light.current;
    if (!lamp) return;
    lamp.target.position.set(side * 2.4, 2.4, HALL.back);
    lamp.target.updateMatrixWorld();
  }, [side]);
  return (
    <spotLight
      ref={light}
      position={[side * 3.4, HALL.height - 0.4, HALL.back + 2.6]}
      angle={0.78}
      penumbra={1}
      intensity={46}
      distance={12}
      decay={1.6}
      color="#fff0dc"
    />
  );
}
