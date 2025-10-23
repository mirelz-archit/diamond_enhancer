// Test script for fallback environment map
// Run this in your browser console to test the fallback environment map

import { createFallbackEnvironmentMap } from './src/model-loader.js';

// Test function to create and display fallback environment map
function testFallbackEnvironmentMap() {
    console.log('Creating fallback environment map...');
    
    try {
        const fallbackEnvMap = createFallbackEnvironmentMap();
        console.log('Fallback environment map created successfully:', fallbackEnvMap);
        console.log('Environment map properties:');
        console.log('- Mapping:', fallbackEnvMap.mapping);
        console.log('- Format:', fallbackEnvMap.format);
        console.log('- Type:', fallbackEnvMap.type);
        console.log('- Size:', fallbackEnvMap.image.width, 'x', fallbackEnvMap.image.height);
        
        // You can also display the canvas in the page for visual inspection
        const canvas = fallbackEnvMap.image;
        canvas.style.position = 'fixed';
        canvas.style.top = '10px';
        canvas.style.right = '10px';
        canvas.style.zIndex = '9999';
        canvas.style.border = '2px solid red';
        canvas.style.width = '200px';
        canvas.style.height = '200px';
        document.body.appendChild(canvas);
        
        console.log('Fallback environment map canvas added to page for visual inspection');
        
        return fallbackEnvMap;
    } catch (error) {
        console.error('Error creating fallback environment map:', error);
        return null;
    }
}

// Function to test diamond material with fallback
function testDiamondMaterialWithFallback(scene) {
    console.log('Testing diamond materials with fallback environment map...');
    
    let diamondCount = 0;
    scene.traverse((child) => {
        if (child.isMesh && child.material && child.material.uniforms && child.material.uniforms.hasEnvMap !== undefined) {
            console.log(`Found diamond material on mesh: ${child.name}`);
            diamondCount++;
            
            // Force use fallback
            child.material.uniforms.hasEnvMap.value = false;
            child.material.uniforms.envMapIntensity.value = 5.0;
            
            console.log('  - Forced to use fallback colors');
            console.log('  - Environment map intensity:', child.material.uniforms.envMapIntensity.value);
        }
    });
    
    console.log(`Total diamond materials found: ${diamondCount}`);
    return diamondCount;
}

// Export functions for use
window.testFallbackEnvironmentMap = testFallbackEnvironmentMap;
window.testDiamondMaterialWithFallback = testDiamondMaterialWithFallback;

console.log('Fallback environment map test functions loaded. Use:');
console.log('- testFallbackEnvironmentMap() to create and test the fallback environment map');
console.log('- testDiamondMaterialWithFallback(scene) to test diamond materials with fallback');
