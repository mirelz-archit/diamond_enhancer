import * as THREE from 'three';

/**
 * Lighting Setup Module
 * Handles the creation and configuration of all lighting for the scene
 */

export function setupLighting(scene) {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    // Main key light - bright and directional
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);
    
    // Fill light - softer, from opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-3, 2, 3);
    scene.add(fillLight);
    
    // Rim light - for edge definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 2, -5);
    scene.add(rimLight);
    
    // Additional point lights for sparkle
    const sparkleLight1 = new THREE.PointLight(0xffffff, 1.5, 10);
    sparkleLight1.position.set(3, 3, 3);
    scene.add(sparkleLight1);
    
    const sparkleLight2 = new THREE.PointLight(0xffffff, 1.0, 8);
    sparkleLight2.position.set(-2, 4, 2);
    scene.add(sparkleLight2);
    
    // Spot light for focused brilliance
    const spotLight = new THREE.SpotLight(0xffffff, 2.0, 20, Math.PI / 6, 0.1);
    spotLight.position.set(0, 8, 0);
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);
    
    return {
        ambientLight,
        keyLight,
        fillLight,
        rimLight,
        sparkleLight1,
        sparkleLight2,
        spotLight
    };
}
