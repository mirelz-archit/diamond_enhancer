import * as THREE from 'three';

/**
 * Diamond Shader Module
 * Contains the advanced diamond shader with ray tracing for internal reflections
 */

export const diamondVertexShader = `
    uniform mat4 worldToModel;
    uniform mat4 cameraToWorld;
    
    varying vec3 localNormal;
    varying vec3 localEyeVector;
    varying vec3 localPosition;
    varying vec2 screenPos;
    varying vec3 debugVertVec;
    
    void main() {
        localNormal = normalize(normal);
        localPosition = position;
        
        // Calculate eye vector in model space
        vec4 modelCameraPosition = worldToModel * vec4(cameraPosition, 1.0);
        localEyeVector = normalize(position - modelCameraPosition.xyz);
        
        debugVertVec = localEyeVector / 0.5 + 0.5;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        screenPos = vec2(gl_Position.xy * 0.5 + 0.5);
    }
`;

export const diamondFragmentShader = `
    uniform mat4 worldToModel;
    uniform mat4 cameraToWorld;
    uniform samplerCube cubeEnvMap;
    uniform mat4 modelToWorld;
    uniform float ior;
    uniform float boundingRadius;
    uniform float envMapIntensity;
    uniform float time;
    uniform int debugMode;
    uniform bool hasEnvMap;
    
    varying vec3 localNormal;
    varying vec3 localEyeVector;
    varying vec3 localPosition;
    varying vec2 screenPos;
    varying vec3 debugVertVec;
    
    // Diamond refractive indices for chromatic dispersion
    vec3 REFRACT_INDEX = vec3(2.407, 2.426, 2.451);
    
    vec3 fetchColor(vec3 ray) {
        if (hasEnvMap) {
            // Check if cubeEnvMap is available, raise error if not
            if (cubeEnvMap == null) {
                // This will cause a shader compilation error
                #error "cubeEnvMap is not available but hasEnvMap is true"
            }
            vec4 color = textureCube(cubeEnvMap, ray);
            return color.xyz * envMapIntensity;
        } else {
            // Enhanced fallback with more interesting colors
            vec3 normalizedRay = normalize(ray);
            
            // Create a more complex color pattern based on ray direction
            float intensity = (normalizedRay.y + 1.0) * 0.5; // 0 to 1 based on Y component
            
            // Create a diamond-like color scheme
            vec3 baseColor = mix(
                vec3(0.1, 0.2, 0.4),    // Dark blue
                vec3(0.8, 0.9, 1.0),   // Light blue-white
                intensity
            );
            
            // Add some sparkle based on ray direction
            float sparkle = sin(normalizedRay.x * 10.0) * cos(normalizedRay.z * 10.0) * 0.3;
            baseColor += vec3(sparkle, sparkle * 0.8, sparkle * 1.2);
            
            // Ensure minimum brightness
            baseColor = max(baseColor, vec3(0.1, 0.15, 0.2));
            
            return baseColor * envMapIntensity;
        }
    }
    
    // Simplified Fresnel calculation
    float computeFresnel(vec3 incidentRay, vec3 surfaceNormal, float ior) {
        float cosI = abs(dot(surfaceNormal, incidentRay));
        float sinT2 = ior * ior * (1.0 - cosI * cosI);
        
        if (sinT2 > 1.0) {
            return 1.0; // Total internal reflection
        }
        
        float cosT = sqrt(1.0 - sinT2);
        float rs = (ior * cosI - cosT) / (ior * cosI + cosT);
        float rp = (cosI - ior * cosT) / (cosI + ior * cosT);
        
        return 0.5 * (rs * rs + rp * rp);
    }
    
    void main() {
        // Dynamic debug modes based on uniform
        bool D_SHOW_VERTEX_DEBUG_ONLY = (debugMode == 1);
        bool D_SHOW_EYEVECTOR_ONLY = (debugMode == 2);
        bool D_SHOW_REFLECTION_DIR_ONLY = (debugMode == 3);
        bool D_SHOW_REFLECTION_ONLY = (debugMode == 4);
        bool D_SHOW_FRESNEL_ONLY = (debugMode == 5);
        bool D_SHOW_REFRACTION_ONLY = (debugMode == 6);
        
        vec3 eyeVector = normalize(localEyeVector);
        vec3 faceNormal = normalize(localNormal);
        
        // Simple reflection
        vec3 reflectDir = reflect(eyeVector, faceNormal);
        vec3 reflectionColor = fetchColor(reflectDir);
        
        // Simple refraction
        vec3 refractDir = refract(eyeVector, faceNormal, 1.0 / REFRACT_INDEX.r);
        vec3 refractionColor = vec3(0.0);
        
        if (length(refractDir) > 0.0) {
            refractionColor = fetchColor(refractDir);
        }
        
        // Fresnel calculation
        float fresnel = computeFresnel(eyeVector, faceNormal, REFRACT_INDEX.r);
        
        // Base color for normal rendering
        vec3 baseColor = mix(refractionColor, reflectionColor, fresnel);
        
        // Debug modes with guaranteed visible output and fallback colors
        if (D_SHOW_VERTEX_DEBUG_ONLY) {
            gl_FragColor = vec4(debugVertVec, 1.0);
        } else if (D_SHOW_EYEVECTOR_ONLY) {
            gl_FragColor = vec4(eyeVector * 0.5 + 0.5, 1.0);
        } else if (D_SHOW_REFLECTION_DIR_ONLY) {
            gl_FragColor = vec4(normalize(reflectDir) * 0.5 + 0.5, 1.0);
        } else if (D_SHOW_REFLECTION_ONLY) {
            // Ensure reflection color is visible even if environment map is missing
            if (hasEnvMap) {
                gl_FragColor = vec4(reflectionColor, 1.0);
            } else {
                // Fallback: show reflection direction as color
                gl_FragColor = vec4(normalize(reflectDir) * 0.5 + 0.5, 1.0);
            }
        } else if (D_SHOW_FRESNEL_ONLY) {
            gl_FragColor = vec4(fresnel, fresnel, fresnel, 1.0);
        } else if (D_SHOW_REFRACTION_ONLY) {
            // Ensure refraction color is visible even if environment map is missing
            if (hasEnvMap) {
                gl_FragColor = vec4(refractionColor, 1.0);
            } else {
                // Fallback: show refraction direction as color
                if (length(refractDir) > 0.0) {
                    gl_FragColor = vec4(normalize(refractDir) * 0.5 + 0.5, 1.0);
                } else {
                    // Total internal reflection case - show red
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                }
            }
        } else {
            // Normal rendering with fallback
            if (hasEnvMap) {
                gl_FragColor = vec4(baseColor, 1.0);
            } else {
                // Fallback: show a simple diamond-like color
                gl_FragColor = vec4(0.8, 0.9, 1.0, 1.0);
            }
        }
    }
`;

export function createDiamondMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            worldToModel: { value: new THREE.Matrix4() },
            cameraToWorld: { value: new THREE.Matrix4() },
            cubeEnvMap: { value: null },
            modelToWorld: { value: new THREE.Matrix4() },
            ior: { value: 2.417 },
            boundingRadius: { value: 1.0 },
            envMapIntensity: { value: 5.0 },
            time: { value: 0.0 },
            debugMode: { value: 0 },
            hasEnvMap: { value: false }
        },
        vertexShader: diamondVertexShader,
        fragmentShader: diamondFragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    });
}
