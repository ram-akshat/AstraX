// src/components/landing/HeroScene.tsx
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line } from "@react-three/drei";
import type { Mesh, Group } from "three";

function Node({ position, color, size = 0.15 }: { position: [number, number, number]; color: string; size?: number }) {
    const meshRef = useRef<Mesh>(null);
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.0012;
        }
    });
    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[size, 20, 20]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.35}
                metalness={0.75}
            />
        </mesh>
    );
}

function Edge({ start, end, color = "#c9a227" }: { start: [number, number, number]; end: [number, number, number]; color?: string }) {
    const points = useMemo<[number, number, number][]>(() => [start, end], [start, end]);
    return <Line points={points} color={color} lineWidth={1} transparent opacity={0.22} />;
}

function NetworkGraph() {
    const groupRef = useRef<Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.035;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.06;
        }
    });

    // Harmonious Tactical Command Palette:
    // - Insignia Golds (#d4af37, #c9a227, #e5c158, #b8901e)
    // - Law Enforcement Tactical Emerald (#10b981, #059669)
    // - Structural Tactical Slate Steel (#64748b, #475569)
    const nodes: { pos: [number, number, number]; color: string; size: number }[] = [
        { pos: [0, 0, 0], color: "#d4af37", size: 0.22 },            // Primary Central Nexus (Insignia Gold)
        { pos: [1.5, 0.8, -0.5], color: "#10b981", size: 0.16 },     // Verified Link Hub (Emerald)
        { pos: [-1.2, 1, 0.6], color: "#c9a227", size: 0.15 },       // Secondary Command Node (Gold)
        { pos: [0.8, -1.2, 0.8], color: "#64748b", size: 0.17 },     // Forensic Evidence Cluster (Slate Steel)
        { pos: [-1.6, -0.5, -0.3], color: "#e5c158", size: 0.16 },   // Intercept Point (Warm Gold)
        { pos: [1.8, -0.3, -1], color: "#475569", size: 0.14 },      // Passive Node (Dark Slate)
        { pos: [-0.5, 1.5, -0.8], color: "#10b981", size: 0.14 },    // Verified Telecom Hit (Emerald)
        { pos: [0.3, -0.8, 1.5], color: "#d4af37", size: 0.13 },     // Financial Mule Cluster (Gold)
        { pos: [-1, -1.3, 0.9], color: "#64748b", size: 0.15 },      // Entity Disambiguation Point (Slate Steel)
        { pos: [1.2, 1.2, 0.5], color: "#b8901e", size: 0.13 },      // Deep Syndicate Anchor (Bronze Gold)
        { pos: [-0.8, 0.2, 1.2], color: "#10b981", size: 0.14 },     // NAFIS Verified Hub (Emerald)
        { pos: [0.5, 0.5, -1.3], color: "#c9a227", size: 0.14 },     // Peripheral Surveillance Node (Gold)
    ];

    const edges: [number, number][] = [
        [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [1, 9],
        [2, 6], [3, 7], [3, 8], [4, 8], [5, 9], [6, 10],
        [7, 10], [2, 11], [5, 11],
    ];

    const edgeColors = ["#c9a227", "#10b981", "#64748b", "#d4af37", "#475569"];

    return (
        <group ref={groupRef}>
            {edges.map(([a, b], i) => (
                <Edge key={i} start={nodes[a].pos} end={nodes[b].pos} color={edgeColors[i % edgeColors.length]} />
            ))}
            {nodes.map((n, i) => (
                <Float key={i} speed={1.2} rotationIntensity={0} floatIntensity={0.25}>
                    <Node position={n.pos} color={n.color} size={n.size} />
                </Float>
            ))}
        </group>
    );
}

export default function HeroScene() {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-insignia-500/10 via-transparent to-surface-100/20" />
        );
    }

    return (
        <div className="absolute inset-0 opacity-55">
            <Canvas
                camera={{ position: [0, 0, 5.2], fov: 45 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                style={{ pointerEvents: "none" }}
            >
                <ambientLight intensity={0.4} />
                <pointLight position={[5, 5, 5]} intensity={0.8} color="#c9a227" />
                <pointLight position={[-5, -3, 3]} intensity={0.4} color="#10b981" />
                <NetworkGraph />
            </Canvas>
        </div>
    );
}
