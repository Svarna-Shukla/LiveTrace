"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

/**
 * Procedural curly-brace silhouette (no external font asset needed). Points
 * trace half of a "{" from top to bottom; mirroring on X gives the "}" and
 * flipping the whole set gives smooth top/bottom symmetry around the
 * mid-height pinch where the brace's tick points outward.
 */
function buildBraceCurve(mirrorX: boolean): THREE.CatmullRomCurve3 {
  const raw: Array<[number, number]> = [
    [0.32, 2.05],
    [-0.55, 1.9],
    [-0.55, 1.3],
    [-0.16, 1.05],
    [-0.55, 0.8],
    [-0.55, 0.16],
    [0.62, 0],
    [-0.55, -0.16],
    [-0.55, -0.8],
    [-0.16, -1.05],
    [-0.55, -1.3],
    [-0.55, -1.9],
    [0.32, -2.05],
  ];
  const sign = mirrorX ? -1 : 1;
  const points = raw.map(([x, y]) => new THREE.Vector3(sign * x, y, 0));
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.35);
}

function Brace({
  mirrorX,
  color,
  emissive,
  position,
}: {
  mirrorX: boolean;
  color: string;
  emissive: string;
  position: [number, number, number];
}) {
  const geometry = useMemo(() => {
    const curve = buildBraceCurve(mirrorX);
    return new THREE.TubeGeometry(curve, 220, 0.16, 24, false);
  }, [mirrorX]);

  return (
    <mesh geometry={geometry} position={position} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.35}
        metalness={1}
        roughness={0.18}
        clearcoat={1}
        clearcoatRoughness={0.08}
        iridescence={1}
        iridescenceIOR={1.3}
        iridescenceThicknessRange={[120, 480]}
        envMapIntensity={1.4}
      />
    </mesh>
  );
}

function RotatingRig() {
  const groupRef = useRef<THREE.Group>(null);
  const lightsRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
    if (lightsRef.current) {
      const t = state.clock.elapsedTime;
      lightsRef.current.rotation.y = t * 0.6;
    }
  });

  return (
    <>
      <group ref={lightsRef}>
        <pointLight position={[3.5, 2, 3]} intensity={18} color="#F5B842" distance={12} />
        <pointLight position={[-3.5, -1.5, 2.5]} intensity={16} color="#8b5cf6" distance={12} />
        <pointLight position={[0, -2.5, -3]} intensity={10} color="#22d3ee" distance={12} />
      </group>
      <group ref={groupRef}>
        <Brace mirrorX={false} color="#f5c86a" emissive="#F5B842" position={[-0.85, 0, 0]} />
        <Brace mirrorX={true} color="#c4b5fd" emissive="#8b5cf6" position={[0.85, 0, 0]} />
      </group>
      <Sparkles count={60} scale={7} size={2.5} speed={0.3} color="#f5c86a" opacity={0.6} />
    </>
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
      <ambientLight intensity={0.45} color="#a78bfa" />
      <directionalLight position={[4, 5, 6]} intensity={0.8} color="#ffffff" />
      <RotatingRig />
    </Canvas>
  );
}
