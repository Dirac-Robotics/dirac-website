"use client";

/* eslint-disable react-hooks/immutability -- R3F updates scene objects and GPU attributes imperatively. */

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { IndustrialRobot, type WorkcellMotion } from "./robot-model";
import { sampleTimeline, type ScrollFrame } from "./scroll-timeline";

export type Workcell3DProps = {
  position: number;
  reducedMotion: boolean;
};

type Vector = [number, number, number];

function MetalBox({ size, at = [0, 0, 0], color = "#8c9798", roughness = 0.35, metalness = 0.75, radius = 0, children }: {
  size: Vector; at?: Vector; color?: string; roughness?: number; metalness?: number; radius?: number; children?: React.ReactNode;
}) {
  const material = <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />;
  return radius > 0 ? <RoundedBox args={size} radius={radius} smoothness={2} position={at} castShadow receiveShadow>{material}{children}</RoundedBox> : <mesh position={at} castShadow receiveShadow><boxGeometry args={size} />{material}{children}</mesh>;
}

function labelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 192;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#eeede4"; ctx.fillRect(0, 0, 256, 192);
  ctx.fillStyle = "#343936";
  ctx.font = "bold 15px monospace"; ctx.fillText("WORKCELL / SAMPLE", 16, 30);
  ctx.font = "10px monospace"; ctx.fillText("PICK → TRANSFER → PLACE", 16, 51);
  for (let i = 0; i < 45; i++) ctx.fillRect(17 + i * 5, 78, i % 3 === 0 ? 3 : 1, 55);
  ctx.font = "12px monospace"; ctx.fillText("01 / WAREHOUSE", 16, 162);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function Package({ position = [0, 0, 0], size = [0.36, 0.32, 0.32], rotation = 0, label, color = "#af8964" }: { position?: Vector; size?: Vector; rotation?: number; label?: THREE.Texture; color?: string }) {
  const [width, height, depth] = size;
  return <group position={position} rotation={[0, rotation, 0]}>
    <RoundedBox args={size} radius={0.008} smoothness={1} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.91} metalness={0.01} /></RoundedBox>
    <MetalBox size={[width * 0.14, 0.004, depth + 0.004]} at={[0, height / 2 + 0.002, 0]} color="#c9ac88" roughness={0.95} metalness={0} />
    <MetalBox size={[width * 0.14, height * 0.35, 0.003]} at={[0, height * 0.32, depth / 2 + 0.003]} color="#c9ac88" roughness={0.95} metalness={0} />
    <mesh position={[width * 0.11, 0, depth / 2 + 0.006]}><planeGeometry args={[width * 0.52, height * 0.5]} /><meshStandardMaterial map={label} color={label ? "#ffffff" : "#e8e8dd"} roughness={0.94} /></mesh>
  </group>;
}

const Tote = memo(function Tote({ position, destination = false }: { position: Vector; destination?: boolean }) {
  const color = destination ? "#606e70" : "#a5afa9";
  const rim = destination ? "#738384" : "#bec6bd";
  return <group position={position}>
    <MetalBox size={[0.84, 0.035, 0.70]} at={[0, 0.023, 0]} color={color} metalness={0.04} roughness={0.72} radius={0.015} />
    <MetalBox size={[0.84, 0.22, 0.035]} at={[0, 0.13, -0.34]} color={color} metalness={0.04} roughness={0.7} radius={0.012} />
    <MetalBox size={[0.84, 0.22, 0.035]} at={[0, 0.13, 0.34]} color={color} metalness={0.04} roughness={0.7} radius={0.012} />
    {[-1, 1].map((side) => <group key={side}>
      <MetalBox size={[0.035, 0.22, 0.66]} at={[side * 0.405, 0.13, 0]} color={color} metalness={0.04} roughness={0.7} radius={0.01} />
      <MetalBox size={[0.036, 0.04, 0.25]} at={[side * 0.426, 0.17, 0]} color="#3d4949" metalness={0.02} roughness={0.75} radius={0.008} />
      <MetalBox size={[0.90, 0.025, 0.052]} at={[0, 0.245, side * 0.35]} color={rim} metalness={0.04} roughness={0.72} radius={0.008} />
      <MetalBox size={[0.05, 0.025, 0.73]} at={[side * 0.425, 0.245, 0]} color={rim} metalness={0.04} roughness={0.72} radius={0.008} />
    </group>)}
    <MetalBox size={[0.30, 0.06, 0.004]} at={[0, 0.14, 0.362]} color={destination ? "#c8d0c9" : "#e08b50"} roughness={0.74} metalness={0.04} />
    {[-0.3, -0.18, 0.18, 0.3].map((x) => <MetalBox key={x} size={[0.009, 0.12, 0.015]} at={[x, 0.115, 0.366]} color={rim} roughness={0.7} metalness={0.04} />)}
  </group>;
});

const Shelf = memo(function Shelf({ label, detail }: { label: THREE.Texture; detail: boolean }) {
  return <group position={[0, 0, -2.30]}>
    {[-2.12, 0, 2.12].flatMap((x) => [-0.37, 0.37].map((z) => <group key={`${x}:${z}`} position={[x, 0, z]}>
      <MetalBox size={[0.085, 2.98, 0.08]} at={[0, 1.49, 0]} color="#687678" roughness={0.54} />
      <MetalBox size={[0.17, 0.022, 0.17]} at={[0, 0.025, 0]} color="#929d9c" roughness={0.54} />
      {detail && [0.45, 0.7, 0.95, 1.4, 1.65, 1.9, 2.35, 2.6, 2.85].map((y) => <MetalBox key={y} size={[0.025, 0.065, 0.002]} at={[0, y, 0.041]} color="#333f40" roughness={0.7} />)}
    </group>))}
    {[0.22, 1.19, 2.18].map((y) => <group key={y}>
      <MetalBox size={[4.29, 0.10, 0.055]} at={[0, y, 0.365]} color="#bf7441" roughness={0.57} metalness={0.3} />
      <MetalBox size={[4.29, 0.10, 0.055]} at={[0, y, -0.365]} color="#bf7441" roughness={0.57} metalness={0.3} />
      <MetalBox size={[4.25, 0.025, 0.68]} at={[0, y + 0.042, 0]} color="#a8ada6" roughness={0.82} metalness={0.2} />
      <MetalBox size={[0.14, 0.045, 0.003]} at={[-1.76, y, 0.395]} color="#efeee3" metalness={0} roughness={0.9} />
    </group>)}
    {[[-1.65, 0.53, 0.01, 0.57, 0.49, 0.54], [-0.91, 0.57, 0.01, 0.64, 0.57, 0.57], [0.55, 0.5, 0.0, 0.71, 0.43, 0.57], [1.43, 0.62, 0, 0.61, 0.67, 0.58], [-1.52, 1.52, 0, 0.69, 0.54, 0.55], [-0.62, 1.44, 0, 0.5, 0.38, 0.59], [0.54, 1.57, 0.03, 0.73, 0.64, 0.57], [1.52, 1.44, 0.02, 0.60, 0.38, 0.56], [-1.59, 2.47, 0.01, 0.58, 0.47, 0.52], [-0.76, 2.51, 0, 0.66, 0.55, 0.58], [0.64, 2.46, 0.02, 0.72, 0.46, 0.57], [1.5, 2.50, 0.02, 0.5, 0.54, 0.55]].map(([x, y, z, w, h, d], index) => <Package key={index} position={[x, y, z]} size={[w, h, d]} rotation={(index % 3 - 1) * 0.018} label={label} color={index % 3 === 0 ? "#b89773" : index % 3 === 1 ? "#ac8a65" : "#c2a482"} />)}
  </group>;
});

const Table = memo(function Table() {
  return <group>
    <MetalBox size={[3.88, 0.10, 2.16]} at={[0, 1.018, 0]} color="#c6ccca" roughness={0.36} metalness={0.72} radius={0.028} />
    <MetalBox size={[3.82, 0.045, 2.10]} at={[0, 0.954, 0]} color="#687475" roughness={0.38} />
    {[-1.72, 1.72].flatMap((x) => [-0.86, 0.86].map((z) => <group key={`${x}:${z}`}>
      <MetalBox size={[0.095, 0.90, 0.095]} at={[x, 0.49, z]} color="#778386" roughness={0.38} />
      <mesh position={[x, 0.053, z]} castShadow><cylinderGeometry args={[0.073, 0.085, 0.065, 24]} /><meshStandardMaterial color="#323d3e" metalness={0.25} roughness={0.7} /></mesh>
      <MetalBox size={[0.17, 0.07, 0.17]} at={[x, 0.892, z]} color="#a4aeae" roughness={0.4} />
    </group>))}
    <MetalBox size={[3.55, 0.065, 0.055]} at={[0, 0.29, 0.86]} color="#7f8b8b" roughness={0.5} />
    <MetalBox size={[3.55, 0.065, 0.055]} at={[0, 0.29, -0.86]} color="#7f8b8b" roughness={0.5} />
    <MetalBox size={[3.47, 0.03, 1.69]} at={[0, 0.33, 0]} color="#b9c0ba" roughness={0.73} metalness={0.3} />
    <MetalBox size={[0.86, 0.52, 0.49]} at={[0.22, 0.63, 0.60]} color="#899694" roughness={0.44} radius={0.02} />
    <MetalBox size={[0.76, 0.44, 0.015]} at={[0.22, 0.63, 0.854]} color="#aab5af" roughness={0.48} radius={0.01} />
    {[-0.2, -0.12, -0.04, 0.04, 0.12, 0.2].map((x) => <MetalBox key={x} size={[0.038, 0.12, 0.004]} at={[x + 0.22, 0.53, 0.865]} color="#505f5d" metalness={0.4} roughness={0.5} />)}
    <MetalBox size={[0.17, 0.05, 0.006]} at={[-1.26, 1.007, 1.084]} color="#596c67" metalness={0.2} roughness={0.65} />
    <mesh position={[0.51, 0.747, 0.87]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.018, 0.018, 0.01, 16]} /><meshStandardMaterial color="#e59050" emissive="#a75420" emissiveIntensity={0.1} /></mesh>
  </group>;
});

const VisionCamera = memo(function VisionCamera() {
  return <group position={[2.23, 0, -0.46]}>
    <MetalBox size={[0.34, 0.045, 0.35]} at={[0, 0.034, 0]} color="#626e70" roughness={0.5} radius={0.015} />
    <MetalBox size={[0.056, 2.25, 0.056]} at={[0, 1.14, 0]} color="#a4b0af" roughness={0.28} />
    <MetalBox size={[0.3, 0.052, 0.052]} at={[-0.12, 2.18, 0]} color="#939f9e" roughness={0.3} />
    <group position={[-0.29, 2.10, 0]} rotation={[0, -0.5, 0.2]}>
      <MetalBox size={[0.23, 0.12, 0.17]} color="#313d40" roughness={0.48} radius={0.014} />
      <mesh position={[0, -0.079, 0]}><cylinderGeometry args={[0.039, 0.039, 0.055, 32]} /><meshStandardMaterial color="#182a30" roughness={0.22} metalness={0.85} /></mesh>
      <mesh position={[0, -0.11, 0]}><cylinderGeometry args={[0.03, 0.03, 0.004, 32]} /><meshStandardMaterial color="#2d5059" roughness={0.1} metalness={0.9} /></mesh>
      <mesh position={[0.089, 0, 0.087]}><sphereGeometry args={[0.009, 12, 8]} /><meshStandardMaterial color="#82ac8c" emissive="#71a980" emissiveIntensity={0.5} /></mesh>
    </group>
  </group>;
});

const TaskPackages = memo(function TaskPackages({ motion, label }: { motion: React.RefObject<WorkcellMotion>; label: THREE.Texture }) {
  const source = useRef<THREE.Group>(null);
  const destination = useRef<THREE.Group>(null);
  useFrame(() => {
    if (source.current) source.current.visible = !motion.current.held && !motion.current.released;
    if (destination.current) destination.current.visible = motion.current.released;
  });
  return <group>
    <group ref={source}><Package position={[-1.14, 1.21, -0.32]} size={[0.2, 0.22, 0.25]} label={label} color="#bc9167" /></group>
    <group ref={destination} visible={false}><Package position={[1.11, 1.21, -0.29]} size={[0.2, 0.22, 0.25]} label={label} color="#bc9167" /></group>
    <Package position={[-1.34, 1.195, -0.54]} size={[0.22, 0.19, 0.22]} label={label} color="#c7a780" />
  </group>;
});

function Warehouse({ frame, motion, lowPower }: { frame: ScrollFrame; motion: React.RefObject<WorkcellMotion>; lowPower: boolean }) {
  const group = useRef<THREE.Group>(null);
  const materials = useRef<THREE.MeshStandardMaterial[]>([]);
  const label = useMemo(() => labelTexture(), []);
  useEffect(() => () => label.dispose(), [label]);
  useLayoutEffect(() => {
    const list: THREE.MeshStandardMaterial[] = [];
    group.current?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material instanceof THREE.MeshStandardMaterial) list.push(material);
      }
    });
    materials.current = list;
  }, []);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = frame.site > 0.001;
    for (const material of materials.current) {
      material.transparent = frame.site < 0.999;
      material.opacity = frame.site;
      material.depthWrite = frame.site > 0.5;
    }
  });
  return <>
    <group ref={group}>
      <Shelf label={label} detail={!lowPower} />
      <Table />
      <Tote position={[-1.13, 1.07, -0.36]} />
      <Tote position={[1.1, 1.07, -0.32]} destination />
      <TaskPackages motion={motion} label={label} />
      <VisionCamera />
      <Package position={[-1.05, 0.55, -0.2]} size={[0.60, 0.39, 0.51]} label={label} color="#a38c70" />
      <MetalBox size={[0.28, 0.24, 0.21]} at={[1.82, 1.24, 0.67]} color="#677975" roughness={0.5} radius={0.015} />
      <mesh position={[1.82, 1.39, 0.67]} castShadow><cylinderGeometry args={[0.053, 0.046, 0.065, 24]} /><meshStandardMaterial color="#b7603d" roughness={0.55} /></mesh>
      {[-1.57, 1.61].map((z) => <MetalBox key={z} size={[5.3, 0.006, 0.025]} at={[0, 0.009, z]} color="#c19d69" metalness={0} roughness={0.95} />)}
      {[-2.64, 2.64].map((x) => <MetalBox key={x} size={[0.025, 0.006, 3.18]} at={[x, 0.009, 0.02]} color="#c19d69" metalness={0} roughness={0.95} />)}
    </group>
  </>;
}

function TrainingPaths({ frame, motion }: { frame: ScrollFrame; motion: React.RefObject<WorkcellMotion> }) {
  const dot = useRef<THREE.Mesh>(null);
  const curves = useMemo(() => [0, 1, 2].map((i) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.14, 1.37, -0.32), new THREE.Vector3(-1.0, 1.88 + i * 0.05, -0.42 + i * 0.08),
    new THREE.Vector3(0, 2.14 + i * 0.03, -0.43 + i * 0.16), new THREE.Vector3(1.0, 1.85, -0.30), new THREE.Vector3(1.11, 1.35, -0.29),
  ])), []);
  useFrame(() => {
    if (!dot.current) return;
    dot.current.visible = frame.activity > 0 && motion.current.held;
    dot.current.position.copy(curves[0].getPointAt(THREE.MathUtils.clamp((motion.current.cycle - 0.25) / 0.52, 0, 1)));
  });
  return <group visible={frame.stage === 2}>
    {curves.map((curve, index) => <mesh key={index}><tubeGeometry args={[curve, 64, index === 0 ? 0.006 : 0.003, 4, false]} /><meshBasicMaterial color={index === 0 ? "#dd8b50" : "#7c9990"} transparent opacity={index === 0 ? 0.5 : 0.27} depthWrite={false} /></mesh>)}
    <mesh ref={dot}><sphereGeometry args={[0.023, 12, 8]} /><meshBasicMaterial color="#d57034" /></mesh>
  </group>;
}

function MotionDriver({ frame, motion }: { frame: ScrollFrame; motion: React.RefObject<WorkcellMotion> }) {
  useFrame(() => {
    const cycle = frame.cycle;
    const waypoints: Vector[] = [
      [-1.14,1.62,-0.32], [-1.14,1.62,-0.32], [-1.14,1.22,-0.32], [-1.14,1.22,-0.32],
      [0,1.84,-0.4], [1.11,1.64,-0.29], [1.11,1.22,-0.29], [1.11,1.22,-0.29], [0,1.94,-0.45],
    ];
    const stops = [0,0.09,0.2,0.29,0.47,0.62,0.72,0.81,1];
    let segment = 0;
    while (segment < stops.length-2 && cycle > stops[segment+1]) segment++;
    const t = (cycle-stops[segment])/(stops[segment+1]-stops[segment]);
    const eased = t*t*(3-2*t);
    const a = waypoints[segment], b = waypoints[segment+1];
    motion.current.target.set(a[0]+(b[0]-a[0])*eased,a[1]+(b[1]-a[1])*eased,a[2]+(b[2]-a[2])*eased);
    motion.current.cycle = cycle;
    motion.current.held = frame.activity > 0.99 && cycle > 0.25 && cycle < 0.77;
    motion.current.released = frame.activity > 0.99 && cycle >= 0.77;
    motion.current.missed = false;
    motion.current.slip = false;
  }, -10);
  return null;
}

function CameraRig({ frame }: { frame: ScrollFrame }) {
  const { camera, size } = useThree();
  const destination = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const aspect = size.width / Math.max(1,size.height);
    const robotDistance = Math.max(1,0.85/aspect);
    const siteDistance = Math.max(1,1.3/aspect);
    const blend = frame.site;
    const x = THREE.MathUtils.lerp(2.7*robotDistance,4.8*siteDistance,blend);
    const z = THREE.MathUtils.lerp(3.7*robotDistance,5.8*siteDistance,blend);
    destination.set(x*Math.cos(frame.orbit)+z*Math.sin(frame.orbit),THREE.MathUtils.lerp(2.2*robotDistance,4.0*siteDistance,blend),z*Math.cos(frame.orbit)-x*Math.sin(frame.orbit));
    target.set(0.08*(1-blend),THREE.MathUtils.lerp(0.92,1.4,blend),-0.4*blend);
    camera.position.copy(destination);
    camera.lookAt(target);
  }, -20);
  return null;
}

function Scene({ frame, lowPower }: { frame: ScrollFrame; lowPower: boolean }) {
  const motion = useRef<WorkcellMotion>({ cycle: 0, held: false, released: false, missed: false, slip: false, target: new THREE.Vector3(-1.14,1.62,-0.32) });
  const invalidate = useThree(state => state.invalidate);
  useLayoutEffect(() => { invalidate(); }, [frame, invalidate]);
  return <>
    <color attach="background" args={["#ebe9e3"]} />
    <fog attach="fog" args={["#ebe9e3", 15, 34]} />
    <ambientLight intensity={0.45} />
    <hemisphereLight args={["#f8fbff", "#aaa093", 1.1]} />
    <directionalLight position={[-4, 8, 5]} color="#fff5e7" intensity={3.1} castShadow shadow-mapSize={[lowPower ? 1024 : 2048, lowPower ? 1024 : 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-normalBias={0.022} shadow-bias={-0.00015} shadow-radius={4} />
    <directionalLight position={[5, 4, -4]} color="#e6f0f2" intensity={1.8} />
    <Environment resolution={lowPower ? 64 : 128} frames={1}>
      <Lightformer form="rect" intensity={3} position={[0, 5, 0]} scale={[7, 7, 1]} rotation={[-Math.PI / 2, 0, 0]} />
      <Lightformer form="rect" intensity={4} position={[-4, 2.5, 2]} scale={[3, 5, 1]} rotation={[0, Math.PI / 2, 0]} />
      <Lightformer form="rect" intensity={2.5} position={[4, 3, -2]} scale={[2, 5, 1]} rotation={[0, -Math.PI / 2, 0]} />
    </Environment>
    <CameraRig frame={frame} />
    <MotionDriver frame={frame} motion={motion} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.014, 0]} receiveShadow><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#d9d6ce" roughness={0.94} metalness={0.03} /></mesh>
    <group visible={frame.site < 0.5}>
      <MetalBox size={[1.2, 0.07, 1.1]} at={[0, 0.025, 0]} color="#cacdca" roughness={0.48} radius={0.028} />
      <MetalBox size={[1.16, 0.012, 1.06]} at={[0, 0.066, 0]} color="#aab1af" roughness={0.4} radius={0.022} />
    </group>
    <Warehouse frame={frame} motion={motion} lowPower={lowPower} />
    <IndustrialRobot frame={frame} motion={motion} detail={!lowPower} />
    <TrainingPaths frame={frame} motion={motion} />
  </>;
}

export default function Workcell3D(props: Workcell3DProps) {
  const [lowPower] = useState(() => typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4));
  const frame = sampleTimeline(props.position, props.reducedMotion);
  const description = frame.stage === 0 ? "A complete robot model with articulated joints and simulation geometry." : "The robot inside a reconstructed warehouse, with shelves, a workbench and task bins.";
  return <div role="img" aria-label={`Illustrative 3D workcell. ${description}`} style={{ width: "100%", height: "100%", position: "relative", touchAction: "pan-y" }}>
    <div aria-hidden="true" style={{ width: "100%", height: "100%" }}>
    <Canvas shadows dpr={lowPower ? [1, 1.25] : [1, 1.7]} frameloop="demand" camera={{ position: [3.6, 2.6, 4.8], fov: 33, near: 0.05, far: 80 }} gl={{ antialias: true, alpha: false, powerPreference: lowPower ? "low-power" : "high-performance" }} style={{ touchAction: "pan-y", pointerEvents: "none" }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.03; gl.shadowMap.type = THREE.PCFSoftShadowMap; }} fallback={<div style={{ padding: 32, color: "#60645c", fontSize: 13 }}>The 3D preview needs WebGL.</div>}>
      <Scene frame={frame} lowPower={lowPower} />
    </Canvas>
    </div>
  </div>;
}
