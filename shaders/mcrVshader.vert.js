
export default `#version 300 es

precision mediump float;
precision mediump sampler3D;
in vec3 position;
in vec3 cubePos;
in vec3 cubeBase;
uniform mat4 mvpMatrix;
uniform mat4 mvMatrix;
uniform mat4 mvMatrixTranspose;
uniform float cubeNum;
uniform sampler3D functionValueTexUnit;
uniform float isosurfaceValue;
out vec4 vPosition;
out vec3 vCubeBase;
out vec3 vRayOrigin;
out vec3 vRayDirection;

float shouldDrawCube(vec3 iCubeBase) {
  float cubeNumInv = 1.0 / cubeNum;
  float result = 0.0;
  vec4 v000 = texture(functionValueTexUnit, iCubeBase + vec3(0.0, 0.0, 0.0) * cubeNumInv);
  vec4 vx00 = texture(functionValueTexUnit, iCubeBase + vec3(1.0, 0.0, 0.0) * cubeNumInv);
  vec4 v0y0 = texture(functionValueTexUnit, iCubeBase + vec3(0.0, 1.0, 0.0) * cubeNumInv);
  vec4 vxy0 = texture(functionValueTexUnit, iCubeBase + vec3(1.0, 1.0, 0.0) * cubeNumInv);
  vec4 v00z = texture(functionValueTexUnit, iCubeBase + vec3(0.0, 0.0, 1.0) * cubeNumInv);
  vec4 vx0z = texture(functionValueTexUnit, iCubeBase + vec3(1.0, 0.0, 1.0) * cubeNumInv);
  vec4 v0yz = texture(functionValueTexUnit, iCubeBase + vec3(0.0, 1.0, 1.0) * cubeNumInv);
  vec4 vxyz = texture(functionValueTexUnit, iCubeBase + vec3(1.0, 1.0, 1.0) * cubeNumInv);
  result = max(result, 1.0 - step(isosurfaceValue, v000.w));
  result = max(result, 1.0 - step(isosurfaceValue, vx00.w));
  result = max(result, 1.0 - step(isosurfaceValue, v0y0.w));
  result = max(result, 1.0 - step(isosurfaceValue, vxy0.w));
  result = max(result, 1.0 - step(isosurfaceValue, v00z.w));
  result = max(result, 1.0 - step(isosurfaceValue, vx0z.w));
  result = max(result, 1.0 - step(isosurfaceValue, v0yz.w));
  result = max(result, 1.0 - step(isosurfaceValue, vxyz.w));
  return result;
}

void main(void) {
  vec4 invalidVertexPos = vec4(-1000.0, -1000.0, 1.0, 1.0);
  vPosition = mvpMatrix * vec4(position, 1.0);
  vCubeBase = cubeBase;
  vRayOrigin = cubePos;
  vRayDirection = (mvMatrixTranspose * mvMatrix * vec4(position, 1.0)).xyz;
  gl_Position = mix(invalidVertexPos, vPosition, shouldDrawCube(cubeBase));
}

`
