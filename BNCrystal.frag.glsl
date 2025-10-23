uniform mat4 worldToModel;
uniform mat4 cameraToWorld;

// uniform samplerCube nonStoneCubeMap;
// uniform samplerCube cubeBackNormals;
// TODO: Rename to stoneCubemap?
uniform samplerCube cubeEnvMap;
uniform mat4 modelToWorld;
uniform float ior;
uniform float boundingRadius;

varying vec3 localNormal;
varying vec3 localEyeVector;
varying vec3 localPosition;
varying vec2 screenPos;

varying vec3 debugVertVec;

// TODO: Green val is a guess.
vec3 REFRACT_INDEX = vec3(2.407, 2.426, 2.451); // vec3(2.407, 2.426, 2.451);

#define MAX_BOUNCE 7

// TODO: Compute this based on the refractive index.
// TODD: Enable this as an uniform?
// Critical angle is 24 degrees.
// float COS_CRITICAL_ANGLE = 0.9135;   // 0.9135; // 0.998; // 0.984;

// TODO: Finetune this.
// vec3 REFRACT_SPREAD = vec3(0.0, 0.002, 0.003);
// TODO: Finetune this.

float getRayHitPlane(const vec3 planePoint, const vec3 planeNormal,
    const vec3 rayOrigin, const vec3 rayDir, inout float intersectDist, inout vec3 intersectNormal) {
    float denom = dot(rayDir, planeNormal);
    if (denom > 0.0) {
        // Compute distance from ray origin to the intersection point on the plane.
        float t = dot(planePoint - rayOrigin, planeNormal) / denom;

        // Update the intersection point if the new intersection point is closer.
        // "t > 0.0" - this ensure that planes in the oppoite direction of the ray are filtered out.
        if (t > 0.0 && t < intersectDist) {
            intersectNormal = planeNormal;
            intersectDist = t;
        }
    }
    return intersectDist;
}

float getRayHitObject(const vec3 position, const vec3 direction, inout vec3 facetNormal) {
    float dist = 100000.0;
    GENRATEDCODE();
    return dist;
}

// vec4 RGBEToLinear(in vec4 value ) {
//     return vec4(value.rgb * exp2( value.a * 255.0 - 128.0 ), 1.0 );
// }

vec3 fetchColor(vec3 ray) {
    // TODO: Convert to world space or is model space a good enough proximation for stones?
    // TODO:
    //  - LOD level for the cubemap - can this be controlled?
    //  - Background / prev layer texture lookup for refraction
    // return textureCube(cubeEnvMap, ray).xyz;
    // TODO: Temp hack for the light intensity.

    vec4 color = textureCube(cubeEnvMap, ray);
    return color.xyz * 1.7;
    // vec4 finalColor = RGBEToLinear(color);
    // return finalColor.xyz * 1.0;
}


// vec4 fetchSpectralColors(vec3 inDirR, vec3 inDirG, vec3 inDirB, bool reflection) {
//     // Convert to world space
//     // TODO: Normalize?
//     vec3 wInDirR = normalize((modelToWorld * vec4(inDirR, 0.0)).xyz);
//     vec3 wInDirG = normalize((modelToWorld * vec4(inDirG, 0.0)).xyz);
//     vec3 wInDirB = normalize((modelToWorld * vec4(inDirB, 0.0)).xyz);
//     // gl_FragColor = vec4((inDirR.r > 0.0 ? 1.0 : 0.0), 0.0, 0.0, 1.0);
//     vec4 color = vec4(vec3(0.0), 1.0);
//     vec4 colorR = textureCube(nonStoneCubeMap, -inDirR);
//     if (!reflection) { // } && colorR.r > 0.0 || colorR.g > 0.0 || colorR.g > 0.0) {
//         // TODO: Should not use world space for nonStone lookup.
//         color.r = 0.9 * colorR.r;
//         color.g = 0.9 * textureCube(nonStoneCubeMap, -inDirR).g;
//         color.b = 0.9 * textureCube(nonStoneCubeMap, -inDirR).b;

//         color.r += 1.0 * textureCube(cubeEnvMap, wInDirR).r;
//         color.g += 1.0 * textureCube(cubeEnvMap, wInDirG).g;
//         color.b += 1.0 * textureCube(cubeEnvMap, wInDirB).b;
//     } else {
//         color.r = textureCube(cubeEnvMap, wInDirR).r;
//         color.g = textureCube(cubeEnvMap, wInDirG).g;
//         color.b = textureCube(cubeEnvMap, wInDirB).b;
//     }
//     return color;
// }

// NOTE: All vectors passed in to this function should be normalized.
float computeFresnel(const vec3 incidentRay, const vec3 surfaceNormal, const vec3 refractedRay,
    const float iorI, const float iorT, float cosCriticalAngle) {

    float cosI = abs(dot(surfaceNormal, incidentRay));
    // TIR case, so only reflection is considered and hence 1.0.
    if (cosI < cosCriticalAngle) {
        return 1.0;
    }

    float cosT = abs(dot(surfaceNormal, refractedRay));
    float etaI = iorI;
    float etaT = iorT;
    float reflectivityP = (etaT * cosI - etaI * cosT) / (etaT * cosI + etaI * cosT);
    float reflectivityS = (etaI * cosI - etaT * cosT) / (etaI * cosI + etaT * cosT);

    return 0.5 * (reflectivityP * reflectivityP + reflectivityS * reflectivityS);
}

// Computes the color of the passed in refracted ray taking into account the internal refraction/TIR of the crystal.
// NOTE: All directional vectors passed in to this function should be normalized.
vec3 computeRefractionColor(vec3 startOrigin, vec3 startDir, vec3 startFaceNormal, const float ior) {
    // eta from object to air => (ior) / (1.0 (air)) => ior
    float etaExit = ior;
    // TODO: Verify this by plugging in the diamond value?
    float cosCriticalAngle = sqrt(max(0.0, 1.0 - 1.0 / (ior * ior)));

    vec3 color = vec3(0);
    float bounceFactor = 1.0;
    float totalRayDist = 0.0;

    vec3 curOrigin = startOrigin;
    vec3 curDir = startDir;
    vec3 curFaceNormal = startFaceNormal;

    for (int i = 0; i < MAX_BOUNCE; i++) {
        float hitDist = getRayHitObject(curOrigin, curDir, curFaceNormal);
        // Note that the curFaceNormal is updated after the above call. However the updated normal is for the
        // outer surface of the hit, so we negate it to get the inner normal that is needed for TIR.
        curFaceNormal = -curFaceNormal;

        // Compute refracted ray.
        vec3 refractedRay = normalize(refract(curDir, curFaceNormal, etaExit));
        float fresnel = computeFresnel(curDir, curFaceNormal, refractedRay, ior, 1.0, cosCriticalAngle);

        totalRayDist += hitDist;
        // TODO: Make this dynamic based on the bounding box size unless passed in?
        float absorption = 1.0;
        // TODO TODO: Add back absorption.
        float normalizedRayDist = totalRayDist / (2.0 * boundingRadius);
        float absorptionFactor = exp(-absorption * normalizedRayDist);
        // float absorptionFactor = exp(-absorption * float(totalRayDist / 20.0));
        color += bounceFactor * ((1.0 - fresnel) * fetchColor(refractedRay)) * absorptionFactor;
        bounceFactor *= fresnel;

        curOrigin = curOrigin + (hitDist * curDir);
        // Compute the next ray dir for TIR.
        curDir = reflect(curDir, curFaceNormal);
    }

    // TODO: Enable debug functionality.
    // vec3 debugNormal = vec3(0.5 + 0.5 * curFaceNormal);
    // return debugNormal;
    // return mix(cumulatedColor, lastNormalAsColor, uDisplayNormals);
    return color;
}

void main() {
    const bool D_SHOW_VERTEX_DEBUG_ONLY = false;
    const bool D_SHOW_EYEVECTOR_ONLY = false;
    const bool D_SHOW_REFLECTION_DIR_ONLY = false;
    const bool D_SHOW_REFLECTION_ONLY = false;
    const bool D_SHOW_FRESNEL_ONLY = false;
    const bool D_SHOW_REFRACTION_ONLY = false;

    // TODO: Check if the eye vector is with respect to the mmodel.
    vec3 eyeVector = normalize(localEyeVector);
    vec3 faceNormal = normalize(localNormal);
    // vec4 modelCameraPosition = worldToModel * vec4(cameraPosition, 1.0);

    // Compute the refracted color along with TIR.
    vec3 refractStartDir = normalize(refract(eyeVector, faceNormal, 1.0 / REFRACT_INDEX.r));
    vec3 refractStartPos = localPosition;
    vec3 refractionColor = computeRefractionColor(refractStartPos, refractStartDir, faceNormal, REFRACT_INDEX.r);

    // Initial ray's fresnel and reflection vector.
    vec3 reflectDir = reflect(eyeVector, faceNormal);
    vec3 reflectionColor = fetchColor(reflectDir);

    // Passing in 0.0 for the cosCriticalAngle param since there is no critical angle for this material transition.
    float iorT = REFRACT_INDEX.r;
    float fresnel = computeFresnel(eyeVector, faceNormal, refractStartDir, 1.0, iorT, 0.0);
    // TODO: Temp hack since fresnel seems to be very low. Should we increae the spread of the eyeVector angle instead?
    // fresnel = clamp(2.0 * fresnel, 0.0, 1.0);

    vec3 finalColor = mix(refractionColor, reflectionColor, fresnel);
    // Is the clamp required? Yes, it seems to be required based on the below debug code.
    vec3 clampedFinalColor = clamp(finalColor, vec3(0.0), vec3(1.0));
    // if (finalColor.x - clampedFinalColor.x > 0.01 ||  finalColor.y - clampedFinalColor.y > 0.01 ||
    //     finalColor.z - clampedFinalColor.z > 0.01) {
    //     finalColor = vec3(1.0, 0.0, 0.0);
    // }
    finalColor = clampedFinalColor;

    if (D_SHOW_VERTEX_DEBUG_ONLY) {
        finalColor = debugVertVec;
    } else if (D_SHOW_EYEVECTOR_ONLY) {
        finalColor = eyeVector / 0.5 + 0.5;
    } else if (D_SHOW_REFLECTION_DIR_ONLY) {
        finalColor = normalize(reflectDir) / 0.5 + 0.5;
    } else if (D_SHOW_REFLECTION_ONLY) {
        finalColor = reflectionColor * fresnel;
    } else if (D_SHOW_FRESNEL_ONLY) {
        finalColor = vec3(0.0, fresnel, 0.0);
    } else if (D_SHOW_REFRACTION_ONLY) {
        finalColor = refractionColor * (1.0 - fresnel);
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
