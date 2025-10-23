import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Import our modular components
import { createScene, createCamera, createRenderer, createEffectComposer, setupPostProcessing } from './scene-setup.js';
import { setupLighting } from './lighting.js';
import { loadModel, modelOptions, loadEnvironmentMaps } from './model-loader.js';
import { setDiamondPreviewFromEquirectTexture } from './environment-manager.js';
import { 
    createModelSelector, 
    createEnvironmentMapControls, 
    createIntensitySliders, 
    createPostProcessingControls, 
    createDebugControls, 
    createDiamondPreview 
} from './ui-controls.js';
import { 
    setupModelSelectorEvents, 
    setupEnvironmentMapEvents, 
    setupIntensitySliderEvents, 
    setupPostProcessingEvents, 
    setupDebugModeEvents, 
    setupWindowResizeEvents 
} from './event-handlers.js';

/**
 * Main Application Class
 * Orchestrates all components and manages the application lifecycle
 */
class DiamondViewerApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.controls = null;
        this.metalEnvMap = null;
        this.diamondEnvMap = null;
        this.diamondTexture = null;
        this.postProcessingPasses = null;
        this.uiControls = {};
        this.animationId = null;
        
        this.init();
    }
    
    async init() {
        try {
            this.setupScene();
            this.setupLighting();
            this.setupPostProcessing();
            this.setupUI();
            this.setupEventHandlers();
            await this.loadInitialEnvironmentMaps();
            await this.loadInitialModel();
            this.setupControls();
            this.startAnimation();
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }
    
    setupScene() {
        this.scene = createScene();
        this.camera = createCamera();
        this.renderer = createRenderer();
        this.composer = createEffectComposer(this.renderer);
        
        document.body.appendChild(this.renderer.domElement);
    }
    
    setupLighting() {
        setupLighting(this.scene);
    }
    
    setupPostProcessing() {
        this.postProcessingPasses = setupPostProcessing(this.composer, this.scene, this.camera);
    }
    
    setupUI() {
        // Create all UI controls
        this.uiControls.modelSelector = createModelSelector(modelOptions);
        this.uiControls.envControls = createEnvironmentMapControls();
        this.uiControls.intensitySliders = createIntensitySliders();
        this.uiControls.postProcessingControls = createPostProcessingControls();
        this.uiControls.debugControls = createDebugControls();
        this.uiControls.diamondPreview = createDiamondPreview();
    }
    
    setupEventHandlers() {
        // Model selection
        setupModelSelectorEvents(
            this.uiControls.modelSelector, 
            this.scene, 
            this.metalEnvMap, 
            this.diamondEnvMap, 
            this.getMetalIntensity(), 
            this.getDiamondIntensity()
        );
        
        // Environment map uploads
        setupEnvironmentMapEvents(
            this.uiControls.envControls.metalEnvMapUploadButton,
            this.uiControls.envControls.diamondEnvMapUploadButton,
            this.renderer,
            this.scene,
            this.metalEnvMap,
            this.diamondEnvMap,
            this.getMetalIntensity(),
            this.getDiamondIntensity(),
            this.updateDiamondPreview.bind(this)
        );
        
        // Intensity sliders
        setupIntensitySliderEvents(
            this.uiControls.intensitySliders.metalEnvIntensitySlider,
            this.uiControls.intensitySliders.metalEnvIntensityLabel,
            this.uiControls.intensitySliders.diamondEnvIntensitySlider,
            this.uiControls.intensitySliders.diamondEnvIntensityLabel,
            this.scene
        );
        
        // Post-processing controls
        setupPostProcessingEvents(
            this.uiControls.postProcessingControls.bloomStrengthSlider,
            this.uiControls.postProcessingControls.bloomStrengthLabel,
            this.uiControls.postProcessingControls.dispersionSlider,
            this.uiControls.postProcessingControls.dispersionLabel,
            this.postProcessingPasses.bloomPass,
            this.postProcessingPasses.rgbShiftPass
        );
        
        // Debug controls
        setupDebugModeEvents(
            this.uiControls.debugControls.debugModeSelect,
            this.uiControls.debugControls.debugModeLabel,
            this.uiControls.debugControls.debugOptions,
            this.scene
        );
        
        // Window resize
        setupWindowResizeEvents(this.camera, this.renderer, this.composer);
    }
    
    async loadInitialEnvironmentMaps() {
        const envMaps = await loadEnvironmentMaps(this.renderer);
        this.metalEnvMap = envMaps.metalEnvMap;
        this.diamondEnvMap = envMaps.diamondEnvMap;
        this.diamondTexture = envMaps.diamondTexture;
        
        console.log('Environment maps loaded:');
        console.log('Metal env map:', this.metalEnvMap);
        console.log('Diamond env map:', this.diamondEnvMap);
        console.log('Diamond texture:', this.diamondTexture);
        
        // Set initial diamond preview
        if (this.diamondTexture) {
            this.setDiamondPreviewFromEquirectTexture(this.diamondTexture);
        }
        
        // Set dark background for better diamond contrast
        this.scene.background = new THREE.Color(0.1, 0.1, 0.1);
    }
    
    async loadInitialModel() {
        await loadModel('earring', this.scene, this.metalEnvMap, this.diamondEnvMap, this.getMetalIntensity(), this.getDiamondIntensity());
    }
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }
    
    startAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.controls.update();
            this.updateShaderUniforms();
            this.composer.render();
        };
        animate();
    }
    
    updateShaderUniforms() {
        this.scene.traverse((child) => {
            if (child.isMesh && child.material && child.material.uniforms) {
                // Update time uniform for any animated effects
                if (child.material.uniforms.time) {
                    child.material.uniforms.time.value = performance.now() * 0.001;
                }
                
                // Update matrix uniforms for diamond shader
                if (child.material.uniforms.worldToModel) {
                    const worldToModel = new THREE.Matrix4();
                    worldToModel.getInverse(child.matrixWorld);
                    child.material.uniforms.worldToModel.value = worldToModel;
                    child.material.uniforms.cameraToWorld.value = this.camera.matrixWorld.clone();
                    child.material.uniforms.modelToWorld.value = child.matrixWorld.clone();
                }
                
                // Debug: Log diamond material state occasionally
                if (child.material.uniforms.debugMode && child.material.uniforms.debugMode.value > 0) {
                    console.log('Diamond material debug mode:', child.material.uniforms.debugMode.value, 'for mesh:', child.name);
                }
            }
        });
    }
    
    updateDiamondPreview(src) {
        this.uiControls.diamondPreview.diamondEnvPreview.src = src;
    }
    
    // Debug function to test fallback environment map
    testFallbackEnvironmentMap() {
        console.log('Testing fallback environment map...');
        
        // Import the fallback function
        import('./model-loader.js').then(({ createFallbackEnvironmentMap }) => {
            const fallbackEnvMap = createFallbackEnvironmentMap();
            console.log('Created fallback environment map:', fallbackEnvMap);
            
            // Apply to all diamond materials
            this.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.uniforms && child.material.uniforms.hasEnvMap !== undefined) {
                    console.log('Applying fallback to diamond material:', child.name);
                    child.material.uniforms.cubeEnvMap.value = fallbackEnvMap;
                    child.material.uniforms.hasEnvMap.value = true;
                    child.material.uniforms.envMapIntensity.value = 5.0;
                    child.material.needsUpdate = true;
                }
            });
            
            console.log('Fallback environment map applied to all diamond materials');
        }).catch(error => {
            console.error('Error importing fallback function:', error);
        });
    }
    
    // Debug function to force fallback colors
    forceFallbackColors() {
        console.log('Forcing fallback colors for all diamond materials...');
        
        this.scene.traverse((child) => {
            if (child.isMesh && child.material && child.material.uniforms && child.material.uniforms.hasEnvMap !== undefined) {
                console.log('Forcing fallback colors for:', child.name);
                child.material.uniforms.hasEnvMap.value = false;
                child.material.uniforms.envMapIntensity.value = 5.0;
                child.material.needsUpdate = true;
            }
        });
        
        console.log('Fallback colors forced for all diamond materials');
    }
    
    setDiamondPreviewFromEquirectTexture(texture) {
        setDiamondPreviewFromEquirectTexture(texture, this.renderer, this.updateDiamondPreview.bind(this));
    }
    
    getMetalIntensity() {
        return parseFloat(this.uiControls.intensitySliders.metalEnvIntensitySlider.value);
    }
    
    getDiamondIntensity() {
        return parseFloat(this.uiControls.intensitySliders.diamondEnvIntensitySlider.value);
    }
    
    // Debug function to convert any material to diamond material for testing
    async convertToDiamondMaterial(meshName) {
        const { createDiamondMaterial } = await import('./diamond-shader.js');
        this.scene.traverse((child) => {
            if (child.isMesh && child.name === meshName) {
                console.log('Converting mesh to diamond material:', child.name);
                child.material = createDiamondMaterial();
                
                // Set up shader uniforms
                const worldToModel = new THREE.Matrix4();
                worldToModel.getInverse(child.matrixWorld);
                child.material.uniforms.worldToModel.value = worldToModel;
                child.material.uniforms.cameraToWorld.value = this.camera.matrixWorld.clone();
                child.material.uniforms.modelToWorld.value = child.matrixWorld.clone();
                child.material.uniforms.boundingRadius.value = 1.0;
                child.material.uniforms.envMapIntensity.value = this.getDiamondIntensity();
                child.material.uniforms.debugMode.value = 0;
                
                if (this.diamondEnvMap) {
                    child.material.uniforms.cubeEnvMap.value = this.diamondEnvMap;
                    child.material.uniforms.hasEnvMap.value = true;
                } else {
                    child.material.uniforms.hasEnvMap.value = false;
                }
                
                console.log('Converted to diamond material with uniforms:', child.material.uniforms);
            }
        });
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clean up resources
        this.scene.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.diamondViewerApp = new DiamondViewerApp();
    
    // Add debug functions to window for easy testing
    window.convertToDiamond = (meshName) => {
        if (window.diamondViewerApp) {
            window.diamondViewerApp.convertToDiamondMaterial(meshName);
        }
    };
    
    window.listMeshes = () => {
        if (window.diamondViewerApp) {
            window.diamondViewerApp.scene.traverse((child) => {
                if (child.isMesh) {
                    console.log('Mesh:', child.name, 'Material:', child.material.type, 'Has uniforms:', !!child.material.uniforms);
                }
            });
        }
    };
    
    window.testDiamondMaterial = () => {
        if (window.diamondViewerApp) {
            // Create a simple test diamond material
            const testMaterial = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(1.0, 1.0, 1.0),
                metalness: 0.0,
                roughness: 0.0,
                transmission: 0.9,
                thickness: 0.5,
                ior: 2.417,
                envMap: window.diamondViewerApp.diamondEnvMap,
                envMapIntensity: 2.0,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            // Apply to first mesh found
            window.diamondViewerApp.scene.traverse((child) => {
                if (child.isMesh && child.name.includes('stone')) {
                    console.log('Applying test diamond material to:', child.name);
                    child.material = testMaterial;
                    return false; // Stop traversal
                }
            });
        }
    };
    
    window.testSimpleShader = () => {
        if (window.diamondViewerApp) {
            // Create a very simple test shader that just shows colors
            const simpleShader = new THREE.ShaderMaterial({
                uniforms: {
                    debugMode: { value: 0 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    void main() {
                        vNormal = normal;
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform int debugMode;
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    void main() {
                        if (debugMode == 1) {
                            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red
                        } else if (debugMode == 2) {
                            gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // Green
                        } else if (debugMode == 3) {
                            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // Blue
                        } else {
                            gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0); // Normal-based color
                        }
                    }
                `,
                side: THREE.DoubleSide
            });
            
            // Apply to first mesh found
            window.diamondViewerApp.scene.traverse((child) => {
                if (child.isMesh && child.name.includes('stone')) {
                    console.log('Applying simple test shader to:', child.name);
                    child.material = simpleShader;
                    return false; // Stop traversal
                }
            });
        }
    };
    
    window.testDebugMode = (mode) => {
        if (window.diamondViewerApp) {
            window.diamondViewerApp.scene.traverse((child) => {
                if (child.isMesh && child.material && child.material.uniforms && child.material.uniforms.debugMode) {
                    child.material.uniforms.debugMode.value = mode;
                    console.log('Set debug mode to:', mode, 'for mesh:', child.name);
                }
            });
        }
    };
    
    window.debugDiamondMaterials = () => {
        if (window.diamondViewerApp) {
            console.log('=== Diamond Material Debug Info ===');
            window.diamondViewerApp.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    console.log('Mesh:', child.name);
                    console.log('  Material type:', child.material.type);
                    console.log('  Has uniforms:', !!child.material.uniforms);
                    if (child.material.uniforms) {
                        console.log('  Uniforms:', Object.keys(child.material.uniforms));
                        if (child.material.uniforms.debugMode) {
                            console.log('  Debug mode:', child.material.uniforms.debugMode.value);
                        }
                        if (child.material.uniforms.hasEnvMap) {
                            console.log('  Has env map:', child.material.uniforms.hasEnvMap.value);
                        }
                        if (child.material.uniforms.cubeEnvMap) {
                            console.log('  Cube env map:', child.material.uniforms.cubeEnvMap.value);
                        }
                    }
                    console.log('---');
                }
            });
        }
    };
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.diamondViewerApp) {
        window.diamondViewerApp.destroy();
    }
});

// Expose debug functions globally for testing
window.addEventListener('load', () => {
    if (window.diamondViewerApp) {
        // Expose debug functions to global scope
        window.testFallbackEnvMap = () => window.diamondViewerApp.testFallbackEnvironmentMap();
        window.forceFallbackColors = () => window.diamondViewerApp.forceFallbackColors();
        
        console.log('Debug functions available:');
        console.log('- testFallbackEnvMap() - Test fallback environment map');
        console.log('- forceFallbackColors() - Force fallback colors for diamonds');
    }
});