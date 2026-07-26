"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { SVGLoader } from "three-stdlib";
import * as THREE from "three";

/** A single "{" outline (outer + inner boundary of a constant-width brace
 * stroke, drawn as one closed SVG path) at font-glyph scale. The "}" is
 * this same geometry mirrored in the scene, not a second path. */
const BRACE_SVG_PATH =
  "M 28.38 215.90 L 24.16 203.41 L 13.62 191.31 L 0.83 181.75 L -13.04 173.06 L -26.81 164.51 L -39.12 155.81 " +
  "L -48.56 147.03 L -54.14 138.62 L -56.00 130.00 L -54.15 121.43 L -48.67 113.26 L -39.44 105.00 L -27.43 97.20 " +
  "L -14.09 90.11 L -0.80 83.64 L 11.29 77.45 L 21.80 70.13 L 28.27 59.47 L 29.84 51.10 L 32.59 47.13 L 38.01 42.58 " +
  "L 45.80 37.96 L 55.18 33.68 L 65.34 30.00 L 75.41 26.92 L 84.63 24.39 L 92.39 22.24 L 101.03 19.52 L 108.22 16.51 " +
  "L 114.34 12.69 L 119.74 5.74 L 119.74 -5.74 L 114.34 -12.69 L 108.22 -16.51 L 101.03 -19.52 L 92.39 -22.24 " +
  "L 84.63 -24.39 L 75.41 -26.92 L 65.34 -30.00 L 55.18 -33.68 L 45.80 -37.96 L 38.01 -42.58 L 32.59 -47.13 " +
  "L 29.84 -51.10 L 28.27 -59.47 L 21.80 -70.13 L 11.29 -77.45 L -0.80 -83.64 L -14.09 -90.11 L -27.43 -97.20 " +
  "L -39.44 -105.00 L -48.67 -113.26 L -54.15 -121.43 L -56.00 -130.00 L -54.14 -138.62 L -48.56 -147.03 " +
  "L -39.12 -155.81 L -26.81 -164.51 L -13.04 -173.06 L 0.83 -181.75 L 13.62 -191.31 L 24.16 -203.41 L 28.38 -215.90 " +
  "L 1.62 -224.10 L 0.01 -217.58 L -5.08 -212.15 L -14.90 -204.91 L -27.85 -196.82 L -42.30 -187.84 L -56.80 -177.52 " +
  "L -69.98 -165.07 L -80.03 -149.28 L -84.00 -130.00 L -80.02 -110.71 L -69.88 -94.97 L -56.49 -82.78 " +
  "L -41.67 -73.09 L -26.81 -65.16 L -13.28 -58.58 L -2.74 -53.21 L 2.37 -49.96 L 1.73 -50.53 L 3.99 -40.34 " +
  "L 11.72 -28.47 L 21.94 -19.65 L 33.46 -13.14 L 45.55 -8.28 L 57.56 -4.56 L 68.83 -1.73 L 78.64 0.38 " +
  "L 86.11 1.87 L 93.58 3.67 L 98.46 5.19 L 100.39 5.90 L 99.01 3.47 L 99.01 -3.47 L 100.39 -5.90 L 98.46 -5.19 " +
  "L 93.58 -3.67 L 86.11 -1.87 L 78.64 -0.38 L 68.83 1.73 L 57.56 4.56 L 45.55 8.28 L 33.46 13.14 L 21.94 19.65 " +
  "L 11.72 28.47 L 3.99 40.34 L 1.73 50.53 L 2.37 49.96 L -2.74 53.21 L -13.28 58.58 L -26.81 65.16 L -41.67 73.09 " +
  "L -56.49 82.78 L -69.88 94.97 L -80.02 110.71 L -84.00 130.00 L -80.03 149.28 L -69.98 165.07 L -56.80 177.52 " +
  "L -42.30 187.84 L -27.85 196.82 L -14.90 204.91 L -5.08 212.15 L 0.01 217.58 L 1.62 224.10 Z";

const EXTRUDE_SETTINGS: THREE.ExtrudeGeometryOptions = {
  depth: 20,
  bevelEnabled: true,
  bevelSegments: 12,
  bevelSize: 4,
  bevelThickness: 4,
};

const SCENE_SCALE = 0.013;
const BASE_ROTATION: [number, number, number] = [0.2, -0.4, 0.05];

function buildBraceGeometry(): THREE.ExtrudeGeometry {
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${BRACE_SVG_PATH}"/></svg>`;
  const data = new SVGLoader().parse(svgMarkup);
  const shapes = data.paths.flatMap((path) => SVGLoader.createShapes(path as unknown as THREE.ShapePath));
  const geometry = new THREE.ExtrudeGeometry(shapes, EXTRUDE_SETTINGS);
  geometry.center();
  return geometry;
}

function Braces() {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => buildBraceGeometry(), []);

  // Very slow Y-axis sway around the fixed 3/4 tilt — not a spin, just a
  // gentle back-and-forth — layered under Float's own floaty wobble.
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = BASE_ROTATION[1] + Math.sin(state.clock.elapsedTime * 0.15) * 0.12;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
      <group ref={groupRef} rotation={BASE_ROTATION} scale={SCENE_SCALE}>
        <mesh geometry={geometry} position={[-115, 0, 0]}>
          <meshPhysicalMaterial color="#E5B760" roughness={0.35} metalness={0.4} transmission={0.1} thickness={0.5} />
        </mesh>
        <mesh geometry={geometry} position={[115, 0, 0]} scale={[-1, 1, 1]}>
          <meshPhysicalMaterial color="#E5B760" roughness={0.35} metalness={0.4} transmission={0.1} thickness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

export default function CodeSymbol3D() {
  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_center,rgba(255,158,44,0.28),transparent_70%)] blur-2xl" />
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        className="!absolute !inset-0"
      >
        <ambientLight intensity={0.35} />
        <directionalLight color="#FFF5E1" intensity={2} position={[-4, 4, 3]} />
        <pointLight color="#FF9E2C" intensity={8} distance={6} position={[0, 0, -0.5]} />
        <Braces />
      </Canvas>
    </div>
  );
}
