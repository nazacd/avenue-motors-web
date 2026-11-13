"use client";

import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { markShapes, plateTexture, wordmarkTexture } from "./plate";

type SceneProps = {
  model: string;
  paint: string;
  lights: boolean;
  // Called once the car is on the turntable, so the page can fade the still away.
  onReady: () => void;
};

const BLACK = "#050506";

// ───────── The car ─────────

// Material names as they come in the model file, grouped by what the part is.
const PARTS = {
  paint: ["Car_Paint_With_Flakes", "Car_paint", "Car_Paint"],
  chrome: ["Car_chrome", "Material.006", "Car_Paint.001", "Material_#2125663081", "Material_#2125663085"],
  brakes: ["Material_#2125663092", "Material_#2125663093"],
  gloss: ["Material_#2125663075", "Material_#2125663077"],
  glass: ["Glass"],
  redGlass: ["Red_car_lights_glass"],
  tailLamps: ["Material.001", "Material_#2125663089", "Material_#2125663074"],
  dayLamps: ["Material_#2125663076"],
  plates: ["Material_#2125663072", "Material_#2125663073"],
};

function buildMaterials() {
  const paint = new THREE.MeshPhysicalMaterial({
    color: BLACK,
    metalness: 0.55,
    roughness: 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.25,
  });
  const dayLamps = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#e4ecff", toneMapped: false });
  const tailLamps = new THREE.MeshStandardMaterial({ color: "#2a0003", emissive: "#ff1420", toneMapped: false });
  return {
    paint,
    dayLamps,
    tailLamps,
    chrome: new THREE.MeshStandardMaterial({ color: "#f4f4f4", metalness: 1, roughness: 0.07 }),
    brakes: new THREE.MeshStandardMaterial({ color: "#5c5c61", metalness: 1, roughness: 0.38 }),
    gloss: new THREE.MeshStandardMaterial({ color: "#060607", metalness: 0.3, roughness: 0.16 }),
    plastic: new THREE.MeshStandardMaterial({ color: "#08080a", metalness: 0, roughness: 0.6 }),
    // The model has no cabin, so the windows are dark privacy glass.
    glass: new THREE.MeshPhysicalMaterial({
      color: "#030405",
      metalness: 0.2,
      roughness: 0.03,
      transparent: true,
      opacity: 0.93,
      envMapIntensity: 1.6,
    }),
    lens: new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0, transparent: true, opacity: 0.2 }),
    redGlass: new THREE.MeshPhysicalMaterial({ color: "#8a0010", roughness: 0.05, transparent: true, opacity: 0.72 }),
  };
}

type Materials = ReturnType<typeof buildMaterials>;

// Splits one mesh in two by where each triangle sits. Used to give the headlamp covers
// clear glass while the windows, which share their material, stay dark.
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
  const second_geometry = geometry.clone();
  geometry.setIndex(first);
  second_geometry.setIndex(second);
  const other = new THREE.Mesh(second_geometry);
  other.applyMatrix4(mesh.matrix);
  mesh.parent?.add(other);
  return other;
}

// Finds where the model's own number plate sits at one end of the car and returns a
// dealer plate placed just in front of it.
function dealerPlate(mesh: THREE.Mesh, end: "front" | "rear", map: THREE.Texture) {
  const position = mesh.geometry.getAttribute("position");
  const point = new THREE.Vector3();
  const box = new THREE.Box3();
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < position.count; i += 1) {
    point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    // The front of this model points down the negative X axis.
    if ((end === "front") === point.x < 0) {
      points.push(point.clone());
      box.expandByPoint(point);
    }
  }
  if (points.length === 0) return null;

  const middle = (box.min.y + box.max.y) / 2;
  const mean = (list: THREE.Vector3[]) => list.reduce((sum, p) => sum + p.x, 0) / Math.max(list.length, 1);
  const top = mean(points.filter((p) => p.y > middle));
  const bottom = mean(points.filter((p) => p.y <= middle));
  // How far the plate leans, read from its top edge sitting further in than its bottom.
  const lean = Math.atan2(top - bottom, (box.max.y - box.min.y) / 2);
  const outward = end === "front" ? -1 : 1;

  const width = (box.max.z - box.min.z) * 0.96;
  const height = Math.min(width / 4.64, (box.max.y - box.min.y) * 0.98);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map, roughness: 0.45, metalness: 0.1 }),
  );
  const surface = end === "front" ? box.min.x : box.max.x;
  plate.position.set(surface + outward * 0.012, middle, (box.min.z + box.max.z) / 2);
  plate.rotation.set(0, (outward * Math.PI) / 2, 0);
  plate.rotateX(lean);
  return plate;
}

function prepareCar(scene: THREE.Object3D, materials: Materials) {
  scene.updateMatrixWorld(true);
  const byName = new Map<string, THREE.Material>();
  (Object.keys(PARTS) as (keyof typeof PARTS)[]).forEach((part) => {
    const material = part === "plates" ? materials.plastic : materials[part];
    PARTS[part].forEach((name) => byName.set(name, material));
  });

  const meshes: THREE.Mesh[] = [];
  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh);
  });

  const plate = plateTexture();
  for (const mesh of meshes) {
    const name = (mesh.material as THREE.Material).name;
    mesh.material = byName.get(name) ?? materials.plastic;

    if (name === "Glass") {
      const windows = splitByTriangle(mesh, (centre) => centre.x < -1.95 && centre.y < 0.9);
      mesh.material = materials.lens;
      windows.material = materials.glass;
    }
    if (name === PARTS.plates[0]) {
      for (const end of ["front", "rear"] as const) {
        const dealer = dealerPlate(mesh, end, plate);
        if (dealer) scene.add(dealer);
      }
    }
  }
}

// The loader hands back the same object for the same file, so each car is set up once
// and its materials are kept beside it.
const prepared = new WeakMap<THREE.Object3D, Materials>();

function materialsFor(scene: THREE.Object3D) {
  let materials = prepared.get(scene);
  if (!materials) {
    materials = buildMaterials();
    prepareCar(scene, materials);
    prepared.set(scene, materials);
  }
  return materials;
}

function applyPaint(materials: Materials, paint: string) {
  materials.paint.color.set(paint);
}

function applyLights(materials: Materials, on: boolean) {
  materials.dayLamps.emissiveIntensity = on ? 5 : 0;
  materials.tailLamps.emissiveIntensity = on ? 2.6 : 0.15;
}

function Car({ model, paint, lights, onReady }: SceneProps) {
  const { scene } = useGLTF(model);
  const materials = materialsFor(scene);

  useEffect(() => applyPaint(materials, paint), [materials, paint]);
  useEffect(() => applyLights(materials, lights), [materials, lights]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return <primitive object={scene} />;
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
          <Car {...props} />
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
