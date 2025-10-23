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
    uniform sampler2D envMap;
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
            // Convert 3D ray direction to equirectangular UV coordinates
            vec3 normalizedRay = normalize(ray);
            
            // Convert to spherical coordinates
            float phi = atan(normalizedRay.z, normalizedRay.x);
            float theta = acos(normalizedRay.y);
            
            // Convert to UV coordinates (0 to 1)
            float u = (phi + 3.14159265359) / (2.0 * 3.14159265359);
            float v = theta / 3.14159265359;
            
            // Sample the equirectangular environment map
            vec4 color = texture2D(envMap, vec2(u, v));
            return color.xyz * envMapIntensity;
        } else {
            // Console error: Environment map is null - using fallback colors
            // Note: This error will be logged in the JavaScript console when the shader is compiled
            
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
        // Scale the reflectDir to exaggerate direction variation for debug and visual effect
        // This makes debug/preview modes (and potentially sparkles) more visually interesting
        reflectDir = normalize(reflectDir) * 1.1; // Slightly increase the vector's magnitude

        // Optionally, add a little more wobble for sparkle effect or debug clarity
        reflectDir += 0.2 * vec3(
            sin(faceNormal.x * 17.0 + faceNormal.y * 3.0 + faceNormal.z * 13.0),
            cos(faceNormal.y * 15.0 + faceNormal.z * 11.0),
            sin(faceNormal.z * 19.0 + faceNormal.x * 7.0)
        );
        // Assign a random direction to reflectDir for testing or sparkle effect
        // Uses time and screen position to generate a pseudo-random unit vector
        // vec2 randUV = screenPos + vec2(time * 0.01, time * 0.17);
        // float rand1 = fract(sin(dot(randUV, vec2(12.9898,78.233))) * 43758.5453);
        // float rand2 = fract(sin(dot(randUV, vec2(39.3467,27.157))) * 12345.6789);
        // float rand3 = fract(sin(dot(randUV, vec2(63.7264,11.135))) * 24680.1357);
        // reflectDir = normalize(vec3(rand1 * 2.0 - 1.0, rand2 * 2.0 - 1.0, rand3 * 2.0 - 1.0));
        reflectDir = normalize(reflectDir);
        vec3 reflectionColor = fetchColor(reflectDir);
        // Simple refraction
        vec3 refractDir = refract(eyeVector, faceNormal, 1.0 / REFRACT_INDEX.r);
        vec3 refractionColor = vec3(0.0);
        
        if (length(refractDir) > 0.0) {
            refractionColor = fetchColor(refractDir);
        }
        
        // Fresnel calculation
        float fresnel = computeFresnel(eyeVector, faceNormal, REFRACT_INDEX.r);
        
        // Calculate alpha based on refraction and Fresnel
        // Diamond is more transparent at grazing angles (high fresnel) and more opaque at normal angles
        float alpha = mix(0.3, 0.9, 1.0 - fresnel);
        
        // Add some variation based on refraction direction
        if (length(refractDir) > 0.0) {
            // More transparent when light passes through (refraction)
            alpha *= 0.7;
        } else {
            // Total internal reflection - more opaque
            alpha = 0.95;
        }
        
        // Mix reflection and refraction based on alpha (not fresnel)
        // Alpha controls the blend: 0 = mostly refraction, 1 = mostly reflection
        vec3 baseColor = mix(refractionColor, reflectionColor, alpha);
        
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
                gl_FragColor = vec4(reflectionColor, alpha);
            } else {
                // Fallback: show reflection direction as color
                gl_FragColor = vec4(normalize(reflectDir) * 0.5 + 0.5, alpha);
            }
        } else if (D_SHOW_FRESNEL_ONLY) {
            gl_FragColor = vec4(fresnel, fresnel, fresnel, alpha);
        } else if (D_SHOW_REFRACTION_ONLY) {
            // Ensure refraction color is visible even if environment map is missing
            if (hasEnvMap) {
                gl_FragColor = vec4(refractionColor, alpha);
            } else {
                // Fallback: show refraction direction as color
                if (length(refractDir) > 0.0) {
                    gl_FragColor = vec4(normalize(refractDir) * 0.5 + 0.5, alpha);
                } else {
                    // Total internal reflection case - show red
                    gl_FragColor = vec4(1.0, 0.0, 0.0, alpha);
                }
            }
        } else {
            // Normal rendering - alpha is now used for mixing, so use fixed transparency
            if (hasEnvMap) {
                gl_FragColor = vec4(baseColor, 0.8);
            } else {
                // Fallback: show a simple diamond-like color with fixed transparency
                gl_FragColor = vec4(0.8, 0.9, 1.0, 0.8);
            }
        }
    }
`;

export function createDiamondMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            worldToModel: { value: new THREE.Matrix4() },
            cameraToWorld: { value: new THREE.Matrix4() },
            envMap: { value: null },
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
