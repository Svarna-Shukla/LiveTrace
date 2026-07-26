"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GOLD = "#F5B842";

/**
 * Procedural curly-brace silhouette (no external font asset needed). Points
 * trace half of a "{" from top to bottom; mirroring on X gives the "}" and
 * flipping the whole set gives smooth top/bottom symmetry around the
 * mid-height pinch where the brace's tick points outward.
 */
function buildBraceCurve(mirrorX: boolean): THREE.CatmullRomCurve3 {
  const raw: Array<[number, number]> = [
    [0.3, 2.0],
    [-0.5, 1.75],
    [-0.5, 1.05],
    [-0.05, 0.55],
    [0.55, 0],
    [-0.05, -0.55],
    [-0.5, -1.05],
    [-0.5, -1.75],
    [0.3, -2.0],
  ];
  const sign = mirrorX ? -1 : 1;
  const points = raw.map(([x, y]) => new THREE.Vector3(sign * x, y, 0));
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.45);
}

interface BraceGeometrySet {
  position: [number, number, number];
  core: THREE.TubeGeometry;
  glowMid: THREE.TubeGeometry;
  glowOuter: THREE.TubeGeometry;
}

/** Warm amber neon-tube look: a bright emissive core plus two oversized,
 * additively-blended "glow shell" copies of the same tube — a cheap
 * stand-in for real bloom post-processing that reads convincingly as a
 * glowing sign against the pure black background. */
function RotatingRig() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.3;
  });

  const braces = useMemo<BraceGeometrySet[]>(() => {
    return [false, true].map((mirrorX) => {
      const curve = buildBraceCurve(mirrorX);
      return {
        position: [mirrorX ? 0.85 : -0.85, 0, 0] as [number, number, number],
        core: new THREE.TubeGeometry(curve, 220, 0.15, 24, false),
        glowMid: new THREE.TubeGeometry(curve, 220, 0.24, 24, false),
        glowOuter: new THREE.TubeGeometry(curve, 220, 0.34, 24, false),
      };
    });
  }, []);

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 0, 3]} intensity={6} color={GOLD} distance={10} />
      {braces.map((brace, i) => (
        <group key={i} position={brace.position}>
          <mesh geometry={brace.glowOuter}>
            <meshBasicMaterial color={GOLD} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh geometry={brace.glowMid}>
            <meshBasicMaterial color={GOLD} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh geometry={brace.core}>
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2.6} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
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
      <ambientLight intensity={0.15} />
      <RotatingRig />
    </Canvas>
  );
}
