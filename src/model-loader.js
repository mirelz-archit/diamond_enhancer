import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { createGoldMaterial, createPureReflectiveMaterial, createMirrorMaterial, createFallbackDiamondMaterial, isDiamondLike } from './materials.js';
import { createDiamondMaterial } from './diamond-shader.js';

/**
 * Model Loader Module
 * Handles loading and processing of 3D models with material assignment
 */

export const modelOptions = {
    earring: '/glbs/earring.glb',
    ring1: '/glbs/ring1.glb',
    lion: '/glbs/lion.glb',
    hn_JWR142156: '/glbs/hn_JWR142156.glb',
    ring: '/glbs/ring.glb',
    sphere: '/glbs/sphere.glb',
    cube: '/glbs/cube.glb',
    bracelet_90: '/glbs/bracelet_90.glb',
    bracelet_1_90: '/glbs/bracelet_1_90.glb',
    bracelet_2_90: '/glbs/bracelet_2_90.glb',
    hn_DER750367: '/glbs/hn_DER750367.glb',
    hn_DSMTG4523: '/glbs/hn_DSMTG4523.glb',
    hn_DSMTG4683: '/glbs/hn_DSMTG4683.glb',
};

export function loadModel(modelName, scene, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity) {
    const loader = new GLTFLoader();
    
    return new Promise((resolve, reject) => {
        loader.load(
            modelOptions[modelName],
            function (gltf) {
                // Clear existing model if any
                scene.children.forEach(child => {
                    if (child.type === 'Group') {
                        scene.remove(child);
                    }
                });
                
                // Apply materials to all meshes
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        console.log('Processing mesh:', child.name, 'Type:', child.type);
                        assignMaterialToMesh(child, modelName, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity);
                    }
                });
                
                scene.add(gltf.scene);
                resolve(gltf.scene);
            },
            undefined,
            function (error) {
                console.error('An error occurred loading the model:', error);
                reject(error);
            }
        );
    });
}

function assignMaterialToMesh(child, modelName, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity) {
    // Assign base metal as gold by default
    child.material = createGoldMaterial();
    
    // Handle different material types based on mesh name
    if (child.name && child.name.startsWith('stone_back')) {
        child.material = createPureReflectiveMaterial();
        applyEnvMapToMaterial(child.material, diamondEnvMap, diamondEnvIntensity);
        
        // Prepare geometry for sharp per-face reflections/refractions
        if (child.geometry.index) {
            child.geometry = child.geometry.toNonIndexed();
        }
        child.geometry.computeVertexNormals();
        child.material.envMapIntensity = diamondEnvIntensity;
        
    } else if (child.name && child.name.startsWith('stone_mirror')) {
        child.material = createMirrorMaterial();
        applyEnvMapToMaterial(child.material, metalEnvMap, metalEnvIntensity);
        child.material.envMapIntensity = metalEnvIntensity;
        
    } else if (child.name === 'stone_3' || child.name.includes('stone') || child.name.includes('diamond')) {
        console.log('Applying diamond material to:', child.name);
        child.material = createDiamondMaterial();
        console.log('Diamond material created with uniforms:', child.material.uniforms);
        
        // Set up shader uniforms for diamond material
        setupDiamondMaterial(child, diamondEnvMap, diamondEnvIntensity);
        
    } else {
        // Apply environment map and intensity for metal materials
        applyEnvMapToMaterial(child.material, metalEnvMap, metalEnvIntensity);
        child.material.envMapIntensity = metalEnvIntensity;
        
        // Load AO maps for specific mesh types
        if (child.name.startsWith('bracelet') || child.name.startsWith('fingerring')) {
            loadAOMap(child, modelName);
        }
    }
}

function createFallbackEnvironmentMap() {
    // Create a simple procedural environment map as fallback
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Create a gradient from dark blue to light blue/white
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, '#1a1a2e');      // Dark blue center
    gradient.addColorStop(0.3, '#16213e');    // Medium blue
    gradient.addColorStop(0.6, '#0f3460');    // Lighter blue
    gradient.addColorStop(0.8, '#533483');    // Purple-blue
    gradient.addColorStop(1, '#e94560');     // Pink-red edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add some noise for more interesting reflections
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 0.1;
        data[i] = Math.min(255, data[i] + noise * 255);     // R
        data[i + 1] = Math.min(255, data[i + 1] + noise * 255); // G
        data[i + 2] = Math.min(255, data[i + 2] + noise * 255); // B
    }
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
}

// Export the fallback function for testing
export { createFallbackEnvironmentMap };

function setupDiamondMaterial(child, diamondEnvMap, diamondEnvIntensity) {
    const worldToModel = new THREE.Matrix4();
    worldToModel.getInverse(child.matrixWorld);
    child.material.uniforms.worldToModel.value = worldToModel;
    child.material.uniforms.cameraToWorld.value = new THREE.Matrix4(); // Will be updated in animation loop
    child.material.uniforms.modelToWorld.value = child.matrixWorld.clone();
    child.material.uniforms.boundingRadius.value = 1.0;
    child.material.uniforms.envMapIntensity.value = diamondEnvIntensity;
    child.material.uniforms.debugMode.value = 0;
    
    // Apply environment map to diamond material
    if (diamondEnvMap) {
        console.log('Setting diamond environment map:', diamondEnvMap);
        console.log('Environment map type:', diamondEnvMap.mapping);
        console.log('Environment map format:', diamondEnvMap.format);
        console.log('Environment map type:', diamondEnvMap.type);
        child.material.uniforms.envMap.value = diamondEnvMap;
        child.material.uniforms.hasEnvMap.value = true;
        console.log('Diamond material uniforms after env map setup:', child.material.uniforms);
    } else {
        console.error('❌ ERROR: Diamond environment map is NULL! Using fallback environment map...');
        console.error('This may cause reduced visual quality in diamond reflections.');
        console.error('Please ensure environment maps are properly loaded.');
        
        // Create and use a fallback environment map
        const fallbackEnvMap = createFallbackEnvironmentMap();
        child.material.uniforms.envMap.value = fallbackEnvMap;
        child.material.uniforms.hasEnvMap.value = true;
        child.material.uniforms.envMapIntensity.value = Math.max(diamondEnvIntensity, 3.0); // Ensure minimum intensity
        console.log('Using fallback environment map with intensity:', child.material.uniforms.envMapIntensity.value);
    }
    
    // Add error handling for shader compilation
    child.material.onBeforeCompile = (shader) => {
        console.log('Diamond shader compiling...');
    };
    
    // Keep the diamond shader material for debug functionality
    console.log('Using diamond shader material with debug support');
}

function applyEnvMapToMaterial(material, envMap, intensity) {
    if (envMap) {
        material.envMap = envMap;
        material.envMapIntensity = intensity;
        material.needsUpdate = true;
    }
}

function loadAOMap(child, modelName) {
    const meshName = child.name;
    const aoMapPath = `/bake_texture/${modelName}_${meshName}_ao.png`;
    
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        aoMapPath,
        function(aoMap) {
            aoMap.flipY = false;
            child.material.aoMap = aoMap;
            child.material.aoMapIntensity = 5.0;
            
            // Add warm tint in darker AO areas
            child.material.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <aomap_fragment>',
                    `
                    #ifdef USE_AOMAP
                        float ambientOcclusion = (texture2D(aoMap, vUv2).r - 1.0) * aoMapIntensity + 1.0;
                        reflectedLight.indirectDiffuse *= ambientOcclusion;
                        reflectedLight.indirectDiffuse += vec3(0.4, 0.08, 0.0) * (1.0 - ambientOcclusion);
                    #endif
                    `
                );
            };
            child.material.needsUpdate = true;
        },
        undefined,
        function(error) {
            console.warn(`Failed to load AO map for ${meshName}:`, error);
        }
    );
}

export function loadEnvironmentMaps(renderer) {
    return new Promise((resolve) => {
        const initialRGBELoader = new RGBELoader();
        
        initialRGBELoader.load('/textures/18.hdr', 
            function(texture) {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                const pmremGenerator = new THREE.PMREMGenerator(renderer);
                const metalEnvMap = pmremGenerator.fromEquirectangular(texture).texture;
                pmremGenerator.dispose();
                
                // Load diamond environment map
                const secondRGBELoader = new RGBELoader();
                secondRGBELoader.load('/textures/Ring_Studio_019_V2.hdr', 
                    function(texture2) {
                        console.log('Diamond HDR loaded successfully');
                        texture2.mapping = THREE.EquirectangularReflectionMapping;
                        const pmremGenerator2 = new THREE.PMREMGenerator(renderer);
                        const diamondEnvMap = pmremGenerator2.fromEquirectangular(texture2).texture;
                        console.log('Diamond environment map created:', diamondEnvMap);
                        pmremGenerator2.dispose();
                        
                        resolve({ metalEnvMap, diamondEnvMap, diamondTexture: texture2 });
                    },
                    undefined,
                    function(error) {
                        console.warn('Failed to load diamond HDR, using fallback:', error);
                        resolve({ metalEnvMap, diamondEnvMap: null, diamondTexture: null });
                    }
                );
            },
            undefined,
            function(error) {
                console.warn('Failed to load metal HDR, using fallback:', error);
                resolve({ metalEnvMap: null, diamondEnvMap: null, diamondTexture: null });
            }
        );
    });
}
