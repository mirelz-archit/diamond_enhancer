import * as THREE from 'three';

/**
 * Materials Module
 * Handles the creation and configuration of all materials used in the scene
 */

export function createGoldMaterial() {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(255/255, 150/255, 50/255),
        metalness: 0.99,
        roughness: 0,
        envMapIntensity: 1.7,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
        ior: 5,
        reflectivity: 1.0,
        emissive: new THREE.Color(0.8, 0, 0),
        emissiveIntensity: 0.1,
        side: THREE.DoubleSide,
    });
}

export function createPureReflectiveMaterial() {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(1.0, 1.0, 1.0),
        metalness: 1.0,
        roughness: 0.0,
        envMapIntensity: 2.0,
        reflectivity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        side: THREE.DoubleSide,
        flatShading: true,
    });
}

export function createMirrorMaterial() {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(1.0, 1.0, 1.0),
        metalness: 1.0,
        roughness: 0.0,
        envMapIntensity: 1.7,
        reflectivity: 1.0,
        opacity: 0.2,
        transparent: true,
        side: THREE.FrontSide,
    });
}

export function createFallbackDiamondMaterial(envMap, envMapIntensity) {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(1.0, 1.0, 1.0),
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.9,
        thickness: 0.5,
        ior: 2.417,
        envMap: envMap,
        envMapIntensity: envMapIntensity,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
}

// Helper function to determine if a material is diamond-like
export function isDiamondLike(material) {
    return (material.transmission && material.transmission > 0) || 
           (material.ior && material.ior >= 2.2 && material.metalness === 0) ||
           (material.uniforms && material.uniforms.ior);
}
