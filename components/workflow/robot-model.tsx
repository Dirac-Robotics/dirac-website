"use client";

/* eslint-disable react-hooks/immutability -- R3F deliberately updates three.js transforms in the render loop. */

import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { ScrollFrame } from "./scroll-timeline";

export type WorkcellMotion = {
  cycle: number;
  held: boolean;
  released: boolean;
  missed: boolean;
  slip: boolean;
  target: THREE.Vector3;
};

type RobotProps = {
  frame: ScrollFrame;
  motion: React.RefObject<WorkcellMotion>;
  detail: boolean;
};

const CHARCOAL = "#272e31";
const ALUMINUM = "#adb7b9";
const ORANGE = "#e27b38";
const UPPER_LENGTH = 0.94;
const FOREARM_LENGTH = 0.86;
const SHOULDER_HEIGHT = 0.40;

function Screw({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.012, 0.012, 0.011, 6]} /><meshStandardMaterial color="#9fa9aa" metalness={0.9} roughness={0.24} /></mesh>
    <mesh position={[0, 0, 0.007]}><boxGeometry args={[0.012, 0.002, 0.001]} /><meshStandardMaterial color="#434a4b" metalness={0.5} roughness={0.4} /></mesh>
  </group>;
}

const Motor = memo(function Motor({ radius = 0.16, depth = 0.26, detail = true }: { radius?: number; depth?: number; detail?: boolean }) {
  return <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow><cylinderGeometry args={[radius, radius, depth, 48]} /><meshStandardMaterial color={CHARCOAL} metalness={0.65} roughness={0.32} /></mesh>
    {[-1, 1].map((side) => <group key={side} position={[0, 0, side * depth / 2]} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[radius * 0.9, radius * 0.94, 0.027, 48]} /><meshStandardMaterial color={ALUMINUM} metalness={0.85} roughness={0.28} /></mesh>
      <mesh position={[0, 0, 0.017]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[radius * 0.64, radius * 0.66, 0.023, 48]} /><meshStandardMaterial color="#343d40" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 0, 0.031]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[radius * 0.32, radius * 0.32, 0.015, 32]} /><meshStandardMaterial color="#8c9799" metalness={0.92} roughness={0.19} /></mesh>
      {detail && [0, 1, 2, 3, 4, 5].map((i) => <Screw key={i} scale={0.8} position={[Math.cos(i * Math.PI / 3) * radius * 0.76, Math.sin(i * Math.PI / 3) * radius * 0.76, 0.026]} />)}
    </group>)}
  </group>;
});

const CastLink = memo(function CastLink({ length, lower = false, wireframe = false, detail = true }: { length: number; lower?: boolean; wireframe?: boolean; detail?: boolean }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const wide = lower ? 0.105 : 0.14;
    const narrow = lower ? 0.082 : 0.11;
    shape.moveTo(-wide + 0.035, 0.04);
    shape.quadraticCurveTo(-wide, 0.04, -wide, 0.09);
    shape.lineTo(-narrow, length - 0.1);
    shape.quadraticCurveTo(-narrow, length - 0.025, -narrow + 0.04, length - 0.025);
    shape.lineTo(narrow - 0.04, length - 0.025);
    shape.quadraticCurveTo(narrow, length - 0.025, narrow, length - 0.1);
    shape.lineTo(wide, 0.09);
    shape.quadraticCurveTo(wide, 0.04, wide - 0.035, 0.04);
    shape.closePath();
    const result = new THREE.ExtrudeGeometry(shape, { depth: lower ? 0.17 : 0.22, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.023, bevelThickness: 0.025, curveSegments: 8 });
    result.translate(0, 0, lower ? -0.085 : -0.11);
    result.computeVertexNormals();
    return result;
  }, [length, lower]);
  const cable = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.07, 0.05, -0.18),
    new THREE.Vector3(-0.115, length * 0.3, -0.195),
    new THREE.Vector3(-0.1, length * 0.67, -0.19),
    new THREE.Vector3(-0.03, length - 0.015, -0.15),
  ]), [length]);
  return <group>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={lower ? "#d8dcdb" : ORANGE} metalness={lower ? 0.48 : 0.36} roughness={lower ? 0.29 : 0.36} /></mesh>
    <RoundedBox args={[lower ? 0.135 : 0.18, length * 0.59, 0.026]} radius={0.021} smoothness={3} position={[0, length * 0.48, lower ? 0.111 : 0.145]} castShadow><meshStandardMaterial color={lower ? "#eff0e9" : "#ed8b49"} metalness={0.3} roughness={0.4} /></RoundedBox>
    <RoundedBox args={[lower ? 0.035 : 0.045, length * 0.37, 0.009]} radius={0.007} smoothness={2} position={[0, length * 0.51, lower ? 0.129 : 0.163]}><meshStandardMaterial color={lower ? ORANGE : "#f3be88"} metalness={0.15} roughness={0.38} /></RoundedBox>
    <mesh geometry={geometry} visible={wireframe} scale={1.012}><meshBasicMaterial color="#427b74" wireframe transparent opacity={0.4} depthWrite={false} /></mesh>
    <mesh castShadow><tubeGeometry args={[cable, 24, 0.022, 8, false]} /><meshStandardMaterial color="#20272a" metalness={0.2} roughness={0.72} /></mesh>
    {detail && [0.17, 0.7].map((factor) => <group key={factor} position={[0, length * factor, 0]}><Screw position={[-0.052, 0, lower ? 0.129 : 0.162]} /><Screw position={[0.052, 0, lower ? 0.129 : 0.162]} /></group>)}
  </group>;
});

const AxisRings = memo(function AxisRings({ radius = 0.24 }: { radius?: number }) {
  return <group>
    <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[radius, 0.0035, 5, 52]} /><meshBasicMaterial color="#cc7144" transparent opacity={0.75} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius, 0.0035, 5, 52]} /><meshBasicMaterial color="#638778" transparent opacity={0.7} /></mesh>
    <mesh><torusGeometry args={[radius, 0.0035, 5, 52]} /><meshBasicMaterial color="#6b86a3" transparent opacity={0.7} /></mesh>
    <axesHelper args={[radius * 1.25]} />
  </group>;
});

const Gripper = memo(function Gripper({ open, held, slip }: { open: React.RefObject<number>; held: React.RefObject<THREE.Group | null>; slip: React.RefObject<number> }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  useFrame(() => {
    if (left.current && right.current) {
      const amount = open.current;
      left.current.position.x = amount;
      right.current.position.x = -amount;
    }
    if (held.current) held.current.position.y = 0.40 + slip.current;
  }, -4);
  return <group>
    <mesh position={[0, 0.07, 0]} castShadow><cylinderGeometry args={[0.083, 0.10, 0.14, 40]} /><meshStandardMaterial color="#aeb8b8" metalness={0.86} roughness={0.25} /></mesh>
    <mesh position={[0, 0.143, 0]} castShadow><cylinderGeometry args={[0.095, 0.095, 0.012, 40]} /><meshStandardMaterial color="#31393b" metalness={0.72} roughness={0.3} /></mesh>
    <RoundedBox args={[0.25, 0.12, 0.15]} radius={0.018} smoothness={3} position={[0, 0.21, 0]} castShadow><meshStandardMaterial color="#d7dedd" metalness={0.82} roughness={0.25} /></RoundedBox>
    <mesh position={[0, 0.217, 0.078]}><boxGeometry args={[0.13, 0.043, 0.005]} /><meshStandardMaterial color="#273133" metalness={0.65} roughness={0.36} /></mesh>
    <mesh position={[0.096, 0.217, 0.079]}><sphereGeometry args={[0.01, 12, 8]} /><meshStandardMaterial color="#79a99a" emissive="#4c9587" emissiveIntensity={0.8} /></mesh>
    <group ref={left} position={[0.12, 0, 0]}>
      <mesh position={[0, 0.319, 0]} castShadow><boxGeometry args={[0.026, 0.18, 0.09]} /><meshStandardMaterial color="#727e81" metalness={0.87} roughness={0.28} /></mesh>
      <mesh position={[-0.009, 0.359, 0]}><boxGeometry args={[0.012, 0.09, 0.086]} /><meshStandardMaterial color="#252e30" roughness={0.94} /></mesh>
    </group>
    <group ref={right} position={[-0.12, 0, 0]}>
      <mesh position={[0, 0.319, 0]} castShadow><boxGeometry args={[0.026, 0.18, 0.09]} /><meshStandardMaterial color="#727e81" metalness={0.87} roughness={0.28} /></mesh>
      <mesh position={[0.009, 0.359, 0]}><boxGeometry args={[0.012, 0.09, 0.086]} /><meshStandardMaterial color="#252e30" roughness={0.94} /></mesh>
    </group>
    <group ref={held} position={[0, 0.4, 0]} visible={false}>
      <RoundedBox args={[0.2, 0.22, 0.25]} radius={0.006} smoothness={1} castShadow><meshStandardMaterial color="#bc9167" roughness={0.89} /></RoundedBox>
      <mesh position={[0, -0.111, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[0.055, 0.25]} /><meshStandardMaterial color="#d2b18b" roughness={0.9} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0, 0.126]}><planeGeometry args={[0.09, 0.075]} /><meshStandardMaterial color="#eeece2" roughness={0.95} /></mesh>
    </group>
  </group>;
});

export function IndustrialRobot({ frame, motion, detail }: RobotProps) {
  const root = useRef<THREE.Group>(null);
  const swivel = useRef<THREE.Group>(null);
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const held = useRef<THREE.Group>(null);
  const fingerOpening = useRef(0.13);
  const slip = useRef(0);
  const model = useRef({ yaw: 0.6, upper: -0.40, lower: 1.89 });

  useFrame(() => {
    if (!root.current || !swivel.current || !shoulder.current || !elbow.current || !wrist.current) return;
    root.current.position.y = 0.085 + frame.site;
    root.current.position.z = frame.site * 0.58;

    let yaw = 0.60, upperAngle = -0.40, lowerAngle = 1.89;
    if (frame.activity > 0) {
      const target = motion.current.target;
      const x = target.x;
      const z = target.z - root.current.position.z;
      const height = target.y + 0.4 - root.current.position.y - SHOULDER_HEIGHT;
      const radius = Math.sqrt(x * x + z * z);
      const distanceSq = Math.min(radius * radius + height * height, (UPPER_LENGTH + FOREARM_LENGTH - 0.005) ** 2);
      const cosine = THREE.MathUtils.clamp((distanceSq - UPPER_LENGTH ** 2 - FOREARM_LENGTH ** 2) / (2 * UPPER_LENGTH * FOREARM_LENGTH), -1, 1);
      lowerAngle = Math.acos(cosine);
      upperAngle = Math.atan2(radius, height) - Math.atan2(FOREARM_LENGTH * Math.sin(lowerAngle), UPPER_LENGTH + FOREARM_LENGTH * cosine);
      yaw = Math.atan2(-z, x);
      upperAngle = THREE.MathUtils.lerp(-0.40,upperAngle,frame.activity);
      lowerAngle = THREE.MathUtils.lerp(1.89,lowerAngle,frame.activity);
      yaw = THREE.MathUtils.lerp(0.60,yaw,frame.activity);
    }
    model.current.yaw = yaw;
    model.current.upper = upperAngle;
    model.current.lower = lowerAngle;
    swivel.current.rotation.y = model.current.yaw;
    swivel.current.position.y = 0;
    shoulder.current.rotation.z = -model.current.upper;
    shoulder.current.position.set(0, SHOULDER_HEIGHT, 0);
    elbow.current.rotation.z = -model.current.lower;
    elbow.current.position.set(0, UPPER_LENGTH, 0);
    wrist.current.rotation.z = model.current.upper + model.current.lower + Math.PI;
    wrist.current.position.set(0, FOREARM_LENGTH, 0);
    fingerOpening.current = motion.current.held ? 0.111 : 0.145;
    if (held.current) held.current.visible = frame.activity > 0.99 && motion.current.held;
    slip.current = motion.current.slip ? Math.max(0, motion.current.cycle - 0.49) * 3.2 : 0;
  }, -5);

  return <group ref={root} position={[0, 0.085 + frame.site, frame.site * 0.58]}>
    <RoundedBox args={[0.6, 0.045, 0.54]} radius={0.025} smoothness={3} position={[0, 0.025, 0]} castShadow receiveShadow><meshStandardMaterial color="#586366" metalness={0.86} roughness={0.3} /></RoundedBox>
    {detail && [-0.23, 0.23].flatMap((x) => [-0.2, 0.2].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.054, z]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.026, 6]} /><meshStandardMaterial color="#aab4b7" metalness={0.91} roughness={0.21} /></mesh>))}
    <mesh position={[0, 0.115, 0]} castShadow receiveShadow><cylinderGeometry args={[0.19, 0.245, 0.16, 48]} /><meshStandardMaterial color={CHARCOAL} metalness={0.62} roughness={0.33} /></mesh>
    <mesh position={[0, 0.193, 0]} castShadow><cylinderGeometry args={[0.203, 0.203, 0.03, 48]} /><meshStandardMaterial color={ALUMINUM} metalness={0.87} roughness={0.22} /></mesh>
    <group ref={swivel}>
      <RoundedBox args={[0.29, 0.25, 0.26]} radius={0.055} smoothness={4} position={[0, 0.302, 0]} castShadow><meshStandardMaterial color={ORANGE} metalness={0.42} roughness={0.33} /></RoundedBox>
      <mesh position={[0, 0.251, -0.143]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.025, 24]} /><meshStandardMaterial color="#242d30" roughness={0.52} metalness={0.5} /></mesh>
      <group ref={shoulder} position={[0, SHOULDER_HEIGHT, 0]}>
        <Motor detail={detail} />
        <CastLink length={UPPER_LENGTH} wireframe={frame.stage === 0} detail={detail} />
        {frame.stage === 0 && <AxisRings />}
        <group ref={elbow} position={[0, UPPER_LENGTH, 0]}>
          <Motor radius={0.135} depth={0.23} detail={detail} />
          <CastLink length={FOREARM_LENGTH} lower wireframe={frame.stage === 0} detail={detail} />
          {frame.stage === 0 && <AxisRings radius={0.20} />}
          <group ref={wrist} position={[0, FOREARM_LENGTH, 0]}>
            <Motor radius={0.095} depth={0.2} detail={detail} />
            {frame.stage === 0 && <AxisRings radius={0.16} />}
            <Gripper open={fingerOpening} held={held} slip={slip} />
          </group>
        </group>
      </group>
    </group>
  </group>;
}
