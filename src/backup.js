import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputEncoding = THREE.sRGBEncoding;

// Enable float16 textures if supported
const gl = renderer.getContext();
let composer;
if (gl.getExtension('EXT_color_buffer_float') && gl.getExtension('OES_texture_float_linear')) {
    console.log('Float16 textures supported');
    const renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        {
            type: THREE.HalfFloatType
        }
    );
    composer = new EffectComposer(renderer, renderTarget);
} else {
    console.warn('Float16 textures not supported - falling back to standard precision');
    composer = new EffectComposer(renderer);
}


document.body.appendChild(renderer.domElement);

// const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const ssrPass = new SSRPass({
    renderer,
    scene,
    camera,
    width: window.innerWidth,
    height: window.innerHeight,
    groundReflector: null,
    selects: null,
    fresnel: true,
    fresnelThickness: 0.3,
    distanceAttenuation: false,
    fade: 0,
    useSelective: true,
});
ssrPass.thickness = 0.1;
ssrPass.maxDistance = 100;
ssrPass.opacity = 0.6;
ssrPass.color = new THREE.Color(1, 0, 0);
composer.addPass(ssrPass);

const GammaCorrectionShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'gamma': { value: 1.0 }
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
        uniform float gamma;
        varying vec2 vUv;
        void main() {
            vec4 tex = texture2D(tDiffuse, vUv);
            gl_FragColor = vec4(pow(tex.rgb, vec3(1.0 / gamma)), tex.a);
        }
    `
};


const SharpnessShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'sharpness': { value: 0.5 },
        'resolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
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
        uniform float sharpness;
        uniform vec2 resolution;
        varying vec2 vUv;
        
        void main() {
            vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);
            vec4 center = texture2D(tDiffuse, vUv);
            vec4 top = texture2D(tDiffuse, vUv + vec2(0.0, texel.y));
            vec4 bottom = texture2D(tDiffuse, vUv + vec2(0.0, -texel.y));
            vec4 left = texture2D(tDiffuse, vUv + vec2(-texel.x, 0.0));
            vec4 right = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0));
            
            vec4 sharpened = center * (1.0 + 4.0 * sharpness) - (top + bottom + left + right) * sharpness;
            gl_FragColor = vec4(sharpened.rgb, 1.0);
        }
    `
};

const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
gammaCorrectionPass.uniforms.gamma.value = 0.8;
composer.addPass(gammaCorrectionPass);


// const sharpnessPass = new ShaderPass(SharpnessShader);
// sharpnessPass.uniforms.sharpness.value = 0.5;
// composer.addPass(sharpnessPass);


// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Gold material
// color: new THREE.Color(200/255, 200/255, 124/255),
const goldMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(255/255, 150/255, 50/255),
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 0.8,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
    ior: 3.0,
    emissive: new THREE.Color(230/255, 0.2, 0),
    emissiveIntensity: 0,
});

// Rhodium material
const rhodiumMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(230/255, 230/255, 232/255),
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 1.5,
    clearcoat: 0.2,
    clearcoatRoughness: 0.2,
    reflectivity: 1.0,
    ior: 2.8,
    emissive: new THREE.Color(0.1, 0.1, 0.12),
    emissiveIntensity: 0.05,
});

const modelOptions = {
    ring: '/glbs/ring.glb',
    sphere: '/glbs/sphere.glb',
    cube: '/glbs/cube.glb',
    bracelet: '/glbs/bracelet_90.glb',
    bracelet_1: '/glbs/bracelet_1_90.glb',
    bracelet_2: '/glbs/bracelet_2_90.glb',
    hn_1: '/glbs/hn_DER750367.glb',
    hn_2: '/glbs/hn_DSMTG4523.glb',
    hn_3: '/glbs/hn_DSMTG4683.glb',
    hn_4: '/glbs/hn_JWR142156.glb'
};

// Add UI for model selection
const modelSelector = document.createElement('select');
modelSelector.style.position = 'absolute';
modelSelector.style.top = '20px';
modelSelector.style.left = '20px';
modelSelector.style.zIndex = '1000';

Object.keys(modelOptions).forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.text = model.charAt(0).toUpperCase() + model.slice(1);
    modelSelector.appendChild(option);
});

document.body.appendChild(modelSelector);

// Add UI for environment map upload
const envMapUploadButton = document.createElement('input');
envMapUploadButton.type = 'file';
envMapUploadButton.accept = '.exr, .hdr, .jpg, .jpeg, .png';
envMapUploadButton.style.position = 'absolute';
envMapUploadButton.style.top = '50px';
envMapUploadButton.style.left = '20px';
envMapUploadButton.style.zIndex = '1000';

const envMapLabel = document.createElement('label');
envMapLabel.innerHTML = 'Upload Environment Map (HDR/EXR/JPG/PNG)';
envMapLabel.style.position = 'absolute';
envMapLabel.style.top = '20px';
envMapLabel.style.left = '150px';
envMapLabel.style.zIndex = '1000';
envMapLabel.style.color = 'white';


// Add envMapIntensity slider
const envMapIntensitySlider = document.createElement('input');
envMapIntensitySlider.type = 'range';
envMapIntensitySlider.min = '0';
envMapIntensitySlider.max = '5';
envMapIntensitySlider.step = '0.1';
envMapIntensitySlider.value = '0.8';
envMapIntensitySlider.style.position = 'absolute';
envMapIntensitySlider.style.top = '80px';
envMapIntensitySlider.style.left = '20px';
envMapIntensitySlider.style.zIndex = '1000';

const envMapIntensityLabel = document.createElement('label');
envMapIntensityLabel.innerHTML = 'Environment Map Intensity: 0.8';
envMapIntensityLabel.style.position = 'absolute';
envMapIntensityLabel.style.top = '80px';
envMapIntensityLabel.style.left = '150px';
envMapIntensityLabel.style.zIndex = '1000';
envMapIntensityLabel.style.color = 'white';


document.body.appendChild(envMapUploadButton);
document.body.appendChild(envMapLabel);
document.body.appendChild(envMapIntensitySlider);
document.body.appendChild(envMapIntensityLabel);


// Add event listener for envMapIntensity slider
envMapIntensitySlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    goldMaterial.envMapIntensity = value;
    envMapIntensityLabel.innerHTML = `Environment Map Intensity: ${value.toFixed(1)}`;
});

// Function to update environment map
function updateEnvironmentMap(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'hdr' || fileExtension === 'exr') {
        const loader = fileExtension === 'hdr' ? new RGBELoader() : new EXRLoader();
        loader.setDataType(THREE.HalfFloatType); // Changed to FloatType
        loader.load(URL.createObjectURL(file), function(texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            
            scene.environment = envMap;
            scene.background = new THREE.Color(0.9, 0.9, 0.9);
            pmremGenerator.dispose();
        });
    } else {
        // For regular images (jpg, png)
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(URL.createObjectURL(file), function(texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            
            scene.environment = envMap;
            scene.background = new THREE.Color(0.9, 0.9, 0.9);
            pmremGenerator.dispose();
        });
    }
}

// Add event listener for environment map upload
envMapUploadButton.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        updateEnvironmentMap(e.target.files[0]);
    }
});

// Modified model loading function
function loadModel(modelName) {
    const loader = new GLTFLoader();
    loader.load(
        modelOptions[modelName],
        function (gltf) {
            // Clear existing model if any
            scene.children.forEach(child => {
                if (child.type === 'Group') {
                    scene.remove(child);
                }
            });
            
            // Apply rhodium material to all meshes
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.material = goldMaterial;
                }
            });
            scene.add(gltf.scene);
        },
        function (progress) {
            console.log('Loading progress: ' + (progress.loaded / progress.total * 100) + '%');
        },
        function (error) {
            console.error('An error occurred loading the model:', error);
        }
    );
}

// Add event listener for model selection
modelSelector.addEventListener('change', (e) => {
    loadModel(e.target.value);
});

// Initial environment map load
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/textures/15.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    
    scene.environment = envMap;
    scene.background = new THREE.Color(0.9, 0.9, 0.9);
    pmremGenerator.dispose();
    // Initial model load
    loadModel('bracelet');
});

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
}

// Handle window resize
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    
    // Update resolution uniform
    // sharpnessPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
}

animate();
