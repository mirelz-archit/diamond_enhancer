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

    // vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    // vec3 worldEyeVector = normalize(worldPosition.xyz - cameraPosition);
    // vec4 modelCameraPosition = worldToModel * cameraToWorld * vec4(cameraPosition, 1.0);
    // localEyeVector = normalize((worldToModel * vec4(worldEyeVector, 1.0))).xyz;

    // CHECCKS FOR EYEVECTOR:
    // 1. cameraPosition changes - correct
    // 2. modelCameraPosition


    // TODO: Remove
    // vec3 testCameraPosition = vec3(0., 0., 1.);
    // vec4 modelCameraPosition = worldToModel * vec4(1.0);
    vec4 modelCameraPosition = worldToModel * vec4(cameraPosition, 1.0);
    // TODO: Consider if this should be computed in the frag shader afer rasterization?
    localEyeVector = (position - modelCameraPosition.xyz);
    localEyeVector = normalize(localEyeVector);
    // float angleSpreadFactor = 5.0;
    // localEyeVector = normalize(vec3(localEyeVector.x * angleSpreadFactor, localEyeVector.y * angleSpreadFactor, localEyeVector.z));
    // TODO: Remove
    // localEyeVector = normalize(testCameraPosition);
    debugVertVec = localEyeVector / 0.5 + 0.5;
    // debugVertVec = vec3(clamp(abs(localEyeVector.x), 0., 1.)
    //    , 0., 0.);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    screenPos = vec2(gl_Position.xy * 0.5 + 0.5);
}
