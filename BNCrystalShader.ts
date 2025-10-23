import {Vector2, Texture, Color } from 'three';

/** Return the back normal crystal shader. */
export function getBNCrystalShader() {
    const diamondShader = {
        uniforms: {
            'resolution': { value: new Vector2() },
            'tDiffuse': { value: new Texture() },
            'tBackNormals': { value: new Texture() },
            'tEnvMap': { value: new Texture() },
            'ior': { value: 0 },
            'cubeBackNormals': { value: 0 },
            'cubeEnvMap': { value: 0 },
            'nonStoneCubeMap': { value: 0 },
            'modelToWorld': {value: 0},
            'worldToModel': {value: 0},
            'cameraToWorld': {value: 0},
            'backgroundTexture': {value: new Texture()},
            'colorMixRatio': {value: 0.5},
            'refractionRatio': {value: 0.5},
            'stoneColor1': {value: new Color()},
            'stoneColor2': {value: new Color()},
            'stoneColor3': {value: new Color()},
            'stoneColor4': {value: new Color()},
            'contrastThreshold': {value: 0.5},
            'contrastDecreaseFactor': {value: 0.9},
            'contrastIncreaseFactor': {value: 1.1},
            'saturationThreshold': {value: 0.5},
            'saturationDecreaseFactor': {value: 0.8},
            'saturationIncreaseFactor': {value: 1.2},
            'numberOfColors': {value: 1},
            'alpha': {value: 1},
            'useBackgroundColor': {value: false},
            'backgroundColor': {value: new Color},
            'useMetal': {value: 1},
            'saturationReduceFactor': {value: 0.0},
        },
        vertDiamond: require('../../../../../src/shaders/stone/bnCrystal.vert.glsl') as string,
        fragDiamond: require('../../../../../src/shaders/stone/bnCrystal.frag.glsl') as string
    };
    return diamondShader;
}
