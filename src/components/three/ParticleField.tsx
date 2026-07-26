"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Points as PointsImpl } from "three";

const PARTICLE_COUNT = 900;

function ParticleSwarm() {
  const pointsRef = useRef<PointsImpl>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 4 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.045;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.15;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.075} color="#a78bfa" transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

function GridLines() {
  const groupRef = useRef<PointsImpl>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += delta * 0.01;
  });
  return (
    <group ref={groupRef as never} rotation={[Math.PI / 2.3, 0, 0]} position={[0, -1.5, 0]}>
      <gridHelper args={[20, 24, "#6d28d9", "#312e81"]} />
    </group>
  );
}

export default function ParticleField() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      className="!absolute !inset-0"
    >
      <ambientLight intensity={0.6} />
      <ParticleSwarm />
      <GridLines />
    </Canvas>
  );
}
