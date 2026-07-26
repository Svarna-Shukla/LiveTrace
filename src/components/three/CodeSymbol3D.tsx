"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const GOLD = "#F5BA42";

/** Verified curly-brace centerline (see scratchpad ribbon-check2.svg): a
 * single continuous path tracing the classic brace silhouette — two smooth
 * arcs per half, meeting at the vertical center through a small rounded
 * corner rather than a true sharp point. A true C0 corner makes any
 * constant-width offset self-intersect on the concave side (the ribbon
 * folds over itself right at the point); rounding the corner first — via a
 * quadratic bezier using the original sharp tip as its control point, from
 * points pulled back along each arm — keeps curvature everywhere shallower
 * than the ribbon's half-width, so the offset stays simple. Coordinates are
 * in local shape units (4.4 tall, 2.0 wide). */
function buildBraceCenterline(mirrorX: boolean): THREE.Path {
  const s = mirrorX ? -1 : 1;
  const path = new THREE.Path();
  const m = (x: number, y: number) => [s * x, y] as const;

  const tip: [number, number] = [1.3, 0];
  const armControl: [number, number] = [0.7, 0.15];
  const cornerPull = 0.42;
  let [dx, dy] = [tip[0] - armControl[0], tip[1] - armControl[1]];
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  const pa: [number, number] = [tip[0] - dx * cornerPull, tip[1] - dy * cornerPull];
  const pb: [number, number] = [pa[0], -pa[1]];

  path.moveTo(...m(0.15, 2.2));
  path.bezierCurveTo(...m(0.15, 1.9), ...m(-0.7, 1.75), ...m(-0.7, 1.3));
  path.bezierCurveTo(...m(-0.7, 0.85), ...m(0.15, 0.7), ...m(0.15, 0.55));
  path.bezierCurveTo(...m(0.15, 0.25), ...m(...armControl), ...m(...pa));
  path.quadraticCurveTo(...m(...tip), ...m(...pb));
  path.bezierCurveTo(...m(0.7, -0.15), ...m(0.15, -0.25), ...m(0.15, -0.55));
  path.bezierCurveTo(...m(0.15, -0.7), ...m(-0.7, -0.85), ...m(-0.7, -1.3));
  path.bezierCurveTo(...m(-0.7, -1.75), ...m(0.15, -1.9), ...m(0.15, -2.2));

  return path;
}

/** Turns an open centerline into a closed ribbon (stroke → fill), the same
 * trick SVG-to-fill conversion uses, so ExtrudeGeometry gets a proper filled
 * 2D shape instead of a zero-thickness line. Width is constant (matching a
 * uniform-thickness brace glyph) except for a small safety dip right at the
 * rounded tooth corner — the corner rounding alone gets curvature close to
 * but not quite past the ribbon's half-width, so this trims the last sliver
 * of self-intersection risk without being visible as an actual taper. */
function ribbonFromCenterline(centerline: THREE.Path, width: number): THREE.Shape {
  const points = centerline.getPoints(240);
  const n = points.length;
  const tipIndex = (n - 1) / 2;
  const tipSafetyZone = 10;
  const widthAt = (i: number) => {
    const tipFactor = 0.8 + 0.2 * Math.min(1, Math.abs(i - tipIndex) / tipSafetyZone);
    return width * tipFactor;
  };

  const left: THREE.Vector2[] = [];
  const right: THREE.Vector2[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];
    const tangent = new THREE.Vector2().subVectors(next, prev).normalize();
    const normal = new THREE.Vector2(-tangent.y, tangent.x);
    const half = widthAt(i) / 2;
    left.push(new THREE.Vector2().addVectors(points[i], normal.clone().multiplyScalar(half)));
    right.push(new THREE.Vector2().addVectors(points[i], normal.clone().multiplyScalar(-half)));
  }

  const shape = new THREE.Shape();
  shape.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) shape.lineTo(left[i].x, left[i].y);
  for (let i = n - 1; i >= 0; i--) shape.lineTo(right[i].x, right[i].y);
  shape.closePath();
  return shape;
}

const EXTRUDE_SETTINGS: THREE.ExtrudeGeometryOptions = {
  depth: 0.3,
  bevelEnabled: true,
  bevelSegments: 16,
  bevelSize: 0.08,
  bevelThickness: 0.08,
  curveSegments: 32,
};

function Brace({ mirrorX, position }: { mirrorX: boolean; position: [number, number, number] }) {
  const geometry = useMemo(() => {
    const shape = ribbonFromCenterline(buildBraceCenterline(mirrorX), 0.28);
    return new THREE.ExtrudeGeometry(shape, EXTRUDE_SETTINGS);
  }, [mirrorX]);

  return (
    <mesh geometry={geometry} position={position}>
      <meshPhysicalMaterial
        color={GOLD}
        emissive={GOLD}
        emissiveIntensity={0.6}
        roughness={0.15}
        metalness={0.8}
        clearcoat={1.0}
      />
    </mesh>
  );
}

function RotatingRig() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.4;
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef}>
        <Brace mirrorX={false} position={[-1.5, 0, 0]} />
        <Brace mirrorX={true} position={[1.5, 0, 0]} />
      </group>
    </Float>
  );
}

export default function CodeSymbol3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      className="!absolute !inset-0"
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 4]} color={GOLD} intensity={3} distance={5} />
      <pointLight position={[3, 2, 3]} color={GOLD} intensity={2} distance={8} />
      <directionalLight position={[-3, 4, 5]} intensity={0.6} color="#ffffff" />
      <RotatingRig />
    </Canvas>
  );
}
