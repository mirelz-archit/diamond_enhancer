import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { isDiamondLike } from './materials.js';

/**
 * Environment Manager Module
 * Handles environment map loading, updating, and preview generation
 */

export function updateEnvironmentMap(file, target, renderer, scene, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity, updateDiamondPreview) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'hdr' || fileExtension === 'exr') {
        const loader = fileExtension === 'hdr' ? new RGBELoader() : new EXRLoader();
        loader.setDataType(THREE.HalfFloatType);
        
        loader.load(URL.createObjectURL(file), function(texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            
            if (target === 'diamond') {
                diamondEnvMap = envMap;
                // Generate a small preview from the original equirect texture
                setDiamondPreviewFromEquirectTexture(texture, updateDiamondPreview);
            } else {
                metalEnvMap = envMap;
            }
            
            // Keep background neutral
            scene.background = new THREE.Color(0.9, 0.9, 0.9);
            
            // Re-apply env maps to all materials
            updateAllMaterials(scene, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity);
            
            pmremGenerator.dispose();
        });
    } else {
        // For regular images (jpg, png)
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(URL.createObjectURL(file), function(texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            
            if (target === 'diamond') {
                diamondEnvMap = envMap;
                // For standard images, show the uploaded image directly
                updateDiamondPreviewFromFile(file, updateDiamondPreview);
            } else {
                metalEnvMap = envMap;
            }
            
            scene.background = new THREE.Color(0.9, 0.9, 0.9);
            updateAllMaterials(scene, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity);
            
            pmremGenerator.dispose();
        });
    }
}

function updateAllMaterials(scene, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity) {
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            applyEnvMapToMaterial(child.material, child, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity);
        }
    });
}

function applyEnvMapToMaterial(material, child, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity) {
    if (isDiamondLike(material)) {
        if (diamondEnvMap) {
            material.envMap = diamondEnvMap;
            material.needsUpdate = true;
            
            // Update shader uniforms for diamond material
            if (material.uniforms) {
                material.uniforms.envMapIntensity.value = diamondEnvIntensity;
                material.uniforms.cubeEnvMap.value = diamondEnvMap;
                material.uniforms.hasEnvMap.value = true;
            }
        } else {
            // No diamond env map available, ensure fallback is working
            if (material.uniforms) {
                material.uniforms.hasEnvMap.value = false;
                material.uniforms.envMapIntensity.value = Math.max(diamondEnvIntensity, 3.0);
                console.log('Diamond material using fallback colors with intensity:', material.uniforms.envMapIntensity.value);
            }
        }
        return;
    }
    
    if (metalEnvMap) {
        material.envMap = metalEnvMap;
        material.needsUpdate = true;
    }
}

export function setDiamondPreviewFromEquirectTexture(texture, renderer, updateDiamondPreview) {
    try {
        const width = 320;
        const height = 180;
        const tmpScene = new THREE.Scene();
        const tmpCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.MeshBasicMaterial({ map: texture })
        );
        tmpScene.add(plane);

        const rt = new THREE.WebGLRenderTarget(width, height, { type: THREE.UnsignedByteType });
        const prevTarget = renderer.getRenderTarget();

        renderer.setRenderTarget(rt);
        renderer.render(tmpScene, tmpCamera);

        const pixels = new Uint8Array(width * height * 4);
        renderer.readRenderTargetPixels(rt, 0, 0, width, height, pixels);

        // Create a canvas and flip Y so the image is upright
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);

        const flipped = document.createElement('canvas');
        flipped.width = width;
        flipped.height = height;
        const ctx2 = flipped.getContext('2d');
        ctx2.translate(0, height);
        ctx2.scale(1, -1);
        ctx2.drawImage(canvas, 0, 0);

        updateDiamondPreview(flipped.toDataURL('image/png'));

        // Cleanup
        plane.geometry.dispose();
        plane.material.dispose();
        rt.dispose();
        renderer.setRenderTarget(prevTarget);
    } catch (err) {
        console.warn('Failed to create diamond HDR preview:', err);
    }
}

export function updateDiamondPreviewFromFile(file, updateDiamondPreview) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
        const url = URL.createObjectURL(file);
        updateDiamondPreview(url);
    } else {
        // HDR/EXR: keep last visible image; add a subtle placeholder background
        updateDiamondPreview('/textures/12.png');
    }
}

export function updateDiamondPreviewFromPath(path, updateDiamondPreview) {
    updateDiamondPreview(path);
}
