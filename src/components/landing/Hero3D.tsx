import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Points, PointMaterial } from '@react-three/drei';
import { useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

function FloatingSphere({ position, scale, color, speed = 1, distort = 0.4 }: any) {
  const mesh = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime() * speed;
    mesh.current.rotation.x = Math.cos(time / 4);
    mesh.current.rotation.y = Math.sin(time / 2);
    
    // Mouse parallax
    const targetX = position[0] + state.mouse.x * (scale * 0.5);
    const targetY = position[1] + state.mouse.y * (scale * 0.5);
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, 0.05);
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, targetY, 0.05);
  });

  return (
    <Float speed={2 * speed} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={mesh} args={[1, 64, 64]} scale={scale} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={distort}
          speed={speed * 2}
          roughness={0.1}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </Sphere>
    </Float>
  );
}

function Grid() {
  const mesh = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.1) * 0.1;
    mesh.current.position.y = -2 + Math.cos(t * 0.2) * 0.1;
  });

  return (
    <group ref={mesh} position={[0, -2, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <gridHelper args={[20, 20, "#1e293b", "#0f172a"]} />
    </group>
  );
}

function ParticleField({ count = 2000 }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 20;
      p[i * 3 + 1] = (Math.random() - 0.5) * 20;
      p[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return p;
  }, [count]);

  const pRef = useRef<THREE.Points>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    pRef.current.rotation.y = time * 0.02;
    pRef.current.rotation.x = time * 0.01;
    
    // Slight mouse movement
    pRef.current.position.x = state.mouse.x * 0.2;
    pRef.current.position.y = state.mouse.y * 0.2;
  });

  return (
    <Points ref={pRef} positions={points} stride={3}>
      <PointMaterial
        transparent
        color="#8ab4f8"
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function DataGlobe() {
  const groupRef = useRef<THREE.Group>(null!);
  const globeRef = useRef<THREE.Mesh>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const ringsRef = useRef<THREE.Group>(null!);

  const pointsPosition = useMemo(() => {
    const p = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const phi = Math.acos(-1 + (2 * i) / 1500);
      const theta = Math.sqrt(1500 * Math.PI) * phi;
      p[i * 3] = Math.cos(theta) * Math.sin(phi) * 1.5;
      p[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * 1.5;
      p[i * 3 + 2] = Math.cos(phi) * 1.5;
    }
    return p;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Group mouse parallax
    const targetX = state.mouse.x * 0.5;
    const targetY = state.mouse.y * 0.5;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);

    // Continuous rotations
    globeRef.current.rotation.y = time * 0.1;
    pointsRef.current.rotation.y = time * 0.15;
    ringsRef.current.rotation.z = time * 0.2;
    ringsRef.current.rotation.x = time * 0.1;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshPhongMaterial
          color="#8ab4f8"
          transparent
          opacity={0.1}
          wireframe
          emissive="#8ab4f8"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      <Points ref={pointsRef} positions={pointsPosition} stride={3}>
        <PointMaterial
          transparent
          color="#8ab4f8"
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <group ref={ringsRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.8, 0.005, 16, 100]} />
          <meshBasicMaterial color="#c084fc" transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[1.9, 0.005, 16, 100]} />
          <meshBasicMaterial color="#8ab4f8" transparent opacity={0.2} />
        </mesh>
      </group>

      <Sphere args={[1.45, 32, 32]}>
        <meshBasicMaterial color="#3d3ace" transparent opacity={0.03} />
      </Sphere>
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 bg-[#060e20]">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={["#060e20"]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#8ab4f8" />
        <spotLight
          position={[-10, 10, 10]}
          angle={0.2}
          penumbra={1}
          intensity={2}
          color="#c084fc"
        />
        
        <DataGlobe />
        <FloatingSphere position={[-3.5, 2, -2]} scale={0.6} color="#c084fc" speed={0.8} distort={0.6} />
        <FloatingSphere position={[3.5, -1.5, -1]} scale={0.4} color="#8ab4f8" speed={1.2} distort={0.3} />
        <FloatingSphere position={[2.5, 2.5, -3]} scale={0.3} color="#ffffff" speed={1.5} distort={0.2} />

        <Grid />
        <ParticleField />
        <fog attach="fog" args={['#060e20', 5, 15]} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060e20] pointer-events-none" />
    </div>
  );
}
