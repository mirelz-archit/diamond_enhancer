import { loadModel, modelOptions } from './model-loader.js';
import { updateEnvironmentMap, updateDiamondPreviewFromFile } from './environment-manager.js';
import { isDiamondLike } from './materials.js';

/**
 * Event Handlers Module
 * Handles all event listeners and user interactions
 */

export function setupModelSelectorEvents(modelSelector, scene, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity) {
    modelSelector.addEventListener('change', (e) => {
        loadModel(e.target.value, scene, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity);
    });
}

export function setupEnvironmentMapEvents(
    metalEnvMapUploadButton, 
    diamondEnvMapUploadButton, 
    renderer, 
    scene, 
    metalEnvMap, 
    diamondEnvMap, 
    metalEnvIntensity, 
    diamondEnvIntensity,
    updateDiamondPreview
) {
    metalEnvMapUploadButton.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            updateEnvironmentMap(e.target.files[0], 'metal', renderer, scene, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity, updateDiamondPreview);
        }
    });
    
    diamondEnvMapUploadButton.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            updateDiamondPreviewFromFile(e.target.files[0], updateDiamondPreview);
            updateEnvironmentMap(e.target.files[0], 'diamond', renderer, scene, metalEnvMap, diamondEnvMap, metalEnvIntensity, diamondEnvIntensity, updateDiamondPreview);
        }
    });
}

export function setupIntensitySliderEvents(
    metalEnvIntensitySlider, 
    metalEnvIntensityLabel, 
    diamondEnvIntensitySlider, 
    diamondEnvIntensityLabel, 
    scene
) {
    metalEnvIntensitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        metalEnvIntensityLabel.innerHTML = `Metal Env Intensity: ${value.toFixed(1)}`;
        updateEnvIntensity(scene, value, parseFloat(diamondEnvIntensitySlider.value));
    });
    
    diamondEnvIntensitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        diamondEnvIntensityLabel.innerHTML = `Diamond Env Intensity: ${value.toFixed(1)}`;
        updateEnvIntensity(scene, parseFloat(metalEnvIntensitySlider.value), value);
    });
}

export function setupPostProcessingEvents(
    bloomStrengthSlider, 
    bloomStrengthLabel, 
    dispersionSlider, 
    dispersionLabel, 
    bloomPass, 
    rgbShiftPass
) {
    bloomStrengthSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        bloomStrengthLabel.innerHTML = `Bloom Strength: ${value.toFixed(1)}`;
        bloomPass.strength = value;
    });
    
    dispersionSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        dispersionLabel.innerHTML = `Dispersion: ${value.toFixed(4)}`;
        rgbShiftPass.uniforms['amount'].value = value;
    });
}

export function setupDebugModeEvents(debugModeSelect, debugModeLabel, debugOptions, scene) {
    debugModeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        debugModeLabel.innerHTML = `Debug Mode: ${debugOptions.find(opt => opt.value === mode).text}`;
        
        // Convert mode string to debug mode number
        let debugModeValue = 0;
        switch(mode) {
            case 'vertex': debugModeValue = 1; break;
            case 'eyevector': debugModeValue = 2; break;
            case 'reflection_dir': debugModeValue = 3; break;
            case 'reflection': debugModeValue = 4; break;
            case 'fresnel': debugModeValue = 5; break;
            case 'refraction': debugModeValue = 6; break;
            default: debugModeValue = 0; break;
        }
        
        console.log('Setting debug mode to:', debugModeValue);
        
        // Update all diamond materials with the new debug mode
        let updatedCount = 0;
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                console.log('Found mesh:', child.name, 'Material type:', child.material.type);
                
                if (child.material.uniforms && child.material.uniforms.debugMode) {
                    child.material.uniforms.debugMode.value = debugModeValue;
                    console.log('Updated debug mode for:', child.name, 'to mode:', debugModeValue);
                    updatedCount++;
                } else {
                    console.log('Mesh', child.name, 'does not have debugMode uniform');
                }
            }
        });
        
        console.log(`Updated ${updatedCount} materials with debug mode ${debugModeValue}`);
        
        // If no diamond materials found, try to apply debug mode to any material with uniforms
        if (updatedCount === 0) {
            console.log('No diamond materials found, checking for any materials with uniforms...');
            scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.uniforms) {
                    console.log('Found material with uniforms:', child.name, 'Uniforms:', Object.keys(child.material.uniforms));
                }
            });
        }
    });
}

export function setupWindowResizeEvents(camera, renderer, composer) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
}

function updateEnvIntensity(scene, metalIntensity, diamondIntensity) {
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            if (isDiamondLike(child.material)) {
                child.material.envMapIntensity = diamondIntensity;
                // Update custom shader uniforms
                if (child.material.uniforms) {
                    child.material.uniforms.envMapIntensity.value = diamondIntensity;
                }
            } else {
                child.material.envMapIntensity = metalIntensity;
            }
            child.material.needsUpdate = true;
        }
    });
}
