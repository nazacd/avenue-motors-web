"use client";

import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { GarageCar } from "@/data/garage";
import { markShapes, plateTexture, wordmarkTexture } from "./plate";

type SceneProps = {
  car: GarageCar;
  paint: string;
  lights: boolean;
  // Called once the car is on the turntable, so the page can fade the still away.
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
    metalness: 0.55,
    roughness: 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.25,
  });
}

const standard = (params: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(params);
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
  const tail = lamp("#2a0003", "#ff1420");
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
      tail.emissiveIntensity = on ? 2.6 : 0.15;
    },
  };
}

// The G 63 comes fully finished, in red with bright trim. The car in stock is black
// throughout: paint, grille, trim and wheels.
function g63(holder: THREE.Group): Controls {
  const paint = paintMaterial();
  const day = lamp("#ffffff", "#e4ecff");
  const tail = lamp("#3a0004", "#ff1420");
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
      tail.emissiveIntensity = on ? 2.4 : 0.15;
    },
  };
}

// The M4 CS has its green paint painted into three textures, together with carbon and
// trim that must stay as they are. Changing colour repaints only the green.
function m4cs(holder: THREE.Group): Controls {
  const painted: { material: THREE.MeshStandardMaterial; source: CanvasImageSource; width: number; height: number }[] = [];
  let day: THREE.MeshStandardMaterial | undefined;
  const tail = lamp("#3a0004", "#ff1420");
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
      tail.emissiveIntensity = on ? 2.4 : 0.15;
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
  const tail = lamp("#4a0006", "#ff1420");
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
      // Trim, with the lamp covers at both ends attached. Left as trim they hide the lamps.
      const notHeadLamps = splitByTriangle(mesh, isHeadLamp);
      mesh.material = day;
      const trim = splitByTriangle(notHeadLamps, isTailLamp);
      notHeadLamps.material = tail;
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
      tail.emissiveIntensity = on ? 2.4 : 0.25;
    },
  };
}

const RECIPES = { maybach, g63, m4cs, flyingSpur };

// The loader hands back the same object for the same file, so each car is set up once.
const prepared = new WeakMap<THREE.Object3D, Prepared>();

function prepare(scene: THREE.Object3D, car: GarageCar) {
  let entry = prepared.get(scene);
  if (!entry) {
    const holder = fit(scene, car);
    entry = { holder, controls: RECIPES[car.recipe](holder) };
    prepared.set(scene, entry);
  }
  return entry;
}

function Car({ car, paint, lights, onReady }: SceneProps) {
  const { scene } = useGLTF(car.model);
  const { holder, controls } = prepare(scene, car);

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

function Turntable({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += Math.min(delta, 0.05) * 0.14;
  });
  return (
    <>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[3.35, 3.45, 0.12, 96]} />
        <meshStandardMaterial color="#101113" metalness={0.6} roughness={0.42} />
      </mesh>
      {/* Starts three-quarter on, nose toward the visitor. */}
      <group ref={group} position={[0, 0.12, 0]} rotation={[0, Math.PI / 2 - 0.6, 0]}>
        {children}
        <ContactShadows position={[0, 0.004, 0]} scale={9} far={1.6} blur={2.4} opacity={0.8} resolution={512} frames={1} />
      </group>
    </>
  );
}

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
    <group position={[0, 2.95, -5.5]}>
      <mesh position={[left, -SIGN_HEIGHT / 2, 0]} scale={[SIGN_HEIGHT, SIGN_HEIGHT, 1]}>
        <extrudeGeometry args={[mark.shapes, { depth: 0.09, bevelEnabled: false }]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffb400" emissiveIntensity={0.55} roughness={0.45} />
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

function Room({ coarse }: { coarse: boolean }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          resolution={coarse ? 512 : 1024}
          blur={[320, 90]}
          mixBlur={1}
          mixStrength={26}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#0b0b0d"
          metalness={0.55}
        />
      </mesh>
      <mesh position={[0, 4.5, -5.6]}>
        <planeGeometry args={[40, 9]} />
        <meshStandardMaterial color="#26272b" roughness={0.9} />
      </mesh>
      {/* The red skirting line of the real showroom. */}
      <mesh position={[0, 0.07, -5.58]}>
        <boxGeometry args={[40, 0.05, 0.02]} />
        <meshBasicMaterial color="#9c1019" />
      </mesh>
      <mesh position={[0, 6.4, -1]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 6.5]} />
        <meshBasicMaterial color="#fff6e6" toneMapped={false} />
      </mesh>
      <Sign />
    </>
  );
}

// What the paint and chrome reflect: the lit ceiling, the sign and two side strips.
function Reflections() {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={["#030304"]} />
      <Lightformer form="rect" intensity={5} position={[0, 6.4, -1]} rotation-x={Math.PI / 2} scale={[9, 6.5, 1]} />
      <Lightformer form="rect" intensity={2.2} color="#ffcc00" position={[-1.8, 2.9, -5.6]} scale={[2.2, 1.4, 1]} />
      <Lightformer form="rect" intensity={2.6} color="#e6ecff" position={[1.3, 2.8, -5.6]} scale={[3.3, 0.7, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[-11, 2.4, 2]} rotation-y={Math.PI / 2} scale={[14, 0.5, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[11, 2.4, 2]} rotation-y={-Math.PI / 2} scale={[14, 0.5, 1]} />
      <Lightformer form="rect" intensity={0.5} position={[0, 2.5, 12]} rotation-y={Math.PI} scale={[16, 4, 1]} />
    </Environment>
  );
}

export default function GarageScene(props: SceneProps) {
  const coarse = useMemo(() => window.matchMedia("(pointer: coarse)").matches, []);
  // An upright screen sees a narrow slice of the room, so the camera stands further
  // back with a wider lens to keep the sign and the whole car in view.
  const upright = useMemo(() => window.innerHeight > window.innerWidth, []);

  return (
    <Canvas
      dpr={[1, coarse ? 1.5 : 1.75]}
      camera={{ position: upright ? [-1.4, 1.7, 12.6] : [-2.8, 1.45, 9.4], fov: upright ? 50 : 30, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[BLACK]} />
      <fog attach="fog" args={[BLACK, 15, 34]} />
      <ambientLight intensity={0.35} />
      <spotLight position={[0, 6.2, 1.5]} angle={0.75} penumbra={0.9} intensity={2.4} decay={0} />
      <directionalLight position={[-6, 4, 6]} intensity={0.5} />
      <Reflections />
      <Room coarse={coarse} />
      <Turntable>
        <Suspense fallback={null}>
          <Car key={props.car.model} {...props} />
        </Suspense>
      </Turntable>
      <OrbitControls
        target={[0, 1.05, 0]}
        enablePan={false}
        enableDamping
        rotateSpeed={0.55}
        minDistance={6.5}
        maxDistance={upright ? 14 : 12}
        minPolarAngle={1.05}
        maxPolarAngle={1.54}
        minAzimuthAngle={-1.2}
        maxAzimuthAngle={1.2}
      />
    </Canvas>
  );
}
