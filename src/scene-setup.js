import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader';

/**
 * Scene Setup Module
 * Handles the creation and configuration of the Three.js scene, camera, and renderer
 */

export function createScene() {
    const scene = new THREE.Scene();
    return scene;
}

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    return camera;
}

export function createRenderer() {
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    return renderer;
}

export function createEffectComposer(renderer) {
    const gl = renderer.getContext();
    let composer;
    
    if (gl.getExtension('EXT_color_buffer_float') && gl.getExtension('OES_texture_float_linear')) {
        console.log('Float16 textures supported');
        const renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            { type: THREE.HalfFloatType }
        );
        composer = new EffectComposer(renderer, renderTarget);
    } else {
        console.warn('Float16 textures not supported - falling back to standard precision');
        composer = new EffectComposer(renderer);
    }
    
    return composer;
}

export function setupPostProcessing(composer, scene, camera) {
    // Render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Bloom pass for diamond sparkle
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.0, // strength
        0.4, // radius
        0.85 // threshold
    );
    composer.addPass(bloomPass);
    
    // Chromatic aberration shader for dispersion effect
    const ChromaticAberrationShader = {
        uniforms: {
            'tDiffuse': { value: null },
            'offset': { value: 0.001 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float offset;
            varying vec2 vUv;
            
            void main() {
                vec2 offset = vec2(offset, 0.0);
                float r = texture2D(tDiffuse, vUv + offset).r;
                float g = texture2D(tDiffuse, vUv).g;
                float b = texture2D(tDiffuse, vUv - offset).b;
                gl_FragColor = vec4(r, g, b, 1.0);
            }
        `
    };
    
    // Chromatic aberration for dispersion effect
    const chromaticAberrationPass = new ShaderPass(ChromaticAberrationShader);
    chromaticAberrationPass.uniforms['offset'].value = 0.001;
    composer.addPass(chromaticAberrationPass);
    
    // RGB shift for dispersion
    const rgbShiftPass = new ShaderPass(RGBShiftShader);
    rgbShiftPass.uniforms['amount'].value = 0.003;
    rgbShiftPass.uniforms['angle'].value = 0.0;
    composer.addPass(rgbShiftPass);
    
    return {
        bloomPass,
        rgbShiftPass
    };
}
