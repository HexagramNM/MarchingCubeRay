
export default `#version 300 es

precision mediump float;
in vec3 position;
in vec3 cubePos;
in vec3 cubeBase;
uniform mat4 mvpMatrix;
uniform mat4 mvMatrix;
uniform mat4 mvMatrixTranspose;
uniform float isosurfaceValue;
out vec4 vPosition;
out vec3 vCubeBase;
out vec3 vRayOrigin;
out vec3 vRayDirection;

void main(void) {
  vPosition = mvpMatrix * vec4(position, 1.0);
  vCubeBase = cubeBase;
  vRayOrigin = cubePos;
  vRayDirection = normalize((mvMatrixTranspose * mvMatrix * vec4(position, 1.0)).xyz);
  gl_Position = vPosition;
}

`
