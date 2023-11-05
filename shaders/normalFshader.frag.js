
export default `#version 300 es

precision mediump float;
precision mediump sampler3D;
uniform mat4 mvMatrixTranspose;
uniform float cubeNum;
uniform sampler3D functionValueTexUnit;
uniform float isosurfaceValue;
uniform vec4 globalColor;
uniform vec3 lightDir;
in vec4 vPosition;
in vec3 vCubeBase;
in vec3 vRayOrigin;
in vec3 vRayDirection;
out vec4 outFlagColor;

float trilinearInterpolation(vec3 pos, vec4 currentFuncValueMinusZ, vec4 currentFuncValuePlusZ) {
  float oneMinusX = 1.0 - pos.x;
  float oneMinusY = 1.0 - pos.y;
  float oneMinusZ = 1.0 - pos.z;
  return oneMinusY * oneMinusZ * (oneMinusX * currentFuncValueMinusZ.x + pos.x * currentFuncValueMinusZ.y)
    + pos.y * oneMinusZ * (oneMinusX * currentFuncValueMinusZ.z + pos.x * currentFuncValueMinusZ.w)
    + oneMinusY * pos.z * (oneMinusX * currentFuncValuePlusZ.x + pos.x * currentFuncValuePlusZ.y)
    + pos.y * pos.z * (oneMinusX * currentFuncValuePlusZ.z + pos.x * currentFuncValuePlusZ.w);
}

void main(void) {
  const float infinity = 100000.0;
  const float epsilon = 0.00001;
  const int divideNum = 8;

  float cubeNumInv = 1.0 / cubeNum;
  vec4 v000 = texture(functionValueTexUnit, vCubeBase + vec3(0.0, 0.0, 0.0) * cubeNumInv);
  vec4 vx00 = texture(functionValueTexUnit, vCubeBase + vec3(1.0, 0.0, 0.0) * cubeNumInv);
  vec4 v0y0 = texture(functionValueTexUnit, vCubeBase + vec3(0.0, 1.0, 0.0) * cubeNumInv);
  vec4 vxy0 = texture(functionValueTexUnit, vCubeBase + vec3(1.0, 1.0, 0.0) * cubeNumInv);
  vec4 v00z = texture(functionValueTexUnit, vCubeBase + vec3(0.0, 0.0, 1.0) * cubeNumInv);
  vec4 vx0z = texture(functionValueTexUnit, vCubeBase + vec3(1.0, 0.0, 1.0) * cubeNumInv);
  vec4 v0yz = texture(functionValueTexUnit, vCubeBase + vec3(0.0, 1.0, 1.0) * cubeNumInv);
  vec4 vxyz = texture(functionValueTexUnit, vCubeBase + vec3(1.0, 1.0, 1.0) * cubeNumInv);
  vec4 funcValueMinusZ = vec4(v000.w, vx00.w, v0y0.w, vxy0.w);
  vec4 funcValuePlusZ = vec4(v00z.w, vx0z.w, v0yz.w, vxyz.w);
  vec4 funcNormalXMinusZ = vec4(v000.x, vx00.x, v0y0.x, vxy0.x);
  vec4 funcNormalXPlusZ = vec4(v00z.x, vx0z.x, v0yz.x, vxyz.x);
  vec4 funcNormalYMinusZ = vec4(v000.y, vx00.y, v0y0.y, vxy0.y);
  vec4 funcNormalYPlusZ = vec4(v00z.y, vx0z.y, v0yz.y, vxyz.y);
  vec4 funcNormalZMinusZ = vec4(v000.z, vx00.z, v0y0.z, vxy0.z);
  vec4 funcNormalZPlusZ = vec4(v00z.z, vx0z.z, v0yz.z, vxyz.z);

  float maxT = infinity;
  for (int idx = 0; idx < 3; idx++) {
    float signDir = step(0.0, vRayDirection[idx]);
    float candidateT = mix(vRayOrigin[idx], 1.0 - vRayOrigin[idx], signDir) / (abs(vRayDirection[idx]) + epsilon);
    maxT = min(maxT, mix(infinity, candidateT, step(epsilon, abs(vRayDirection[idx]))));
  }
  maxT = max(maxT, 0.0);

  vec3 currentRayPos = vRayOrigin;
  float oneStepT = maxT / float(divideNum);

  vec3 hitPos;
  float hitFlag = 0.0;
  for (int idx = 0; idx <= divideNum; idx++) {
    float currentValue = trilinearInterpolation(currentRayPos, funcValueMinusZ, funcValuePlusZ) - isosurfaceValue;
    hitPos = mix(currentRayPos, hitPos, hitFlag);
    hitFlag = max(hitFlag, 1.0 - step(0.0, currentValue));
    currentRayPos += oneStepT * vRayDirection;
  }

  vec3 surfaceNormal;
  surfaceNormal.x = trilinearInterpolation(hitPos, funcNormalXMinusZ, funcNormalXPlusZ);
  surfaceNormal.y = trilinearInterpolation(hitPos, funcNormalYMinusZ, funcNormalYPlusZ);
  surfaceNormal.z = trilinearInterpolation(hitPos, funcNormalZMinusZ, funcNormalZPlusZ);
  surfaceNormal = normalize(surfaceNormal);

  vec3 lightDirInCube = normalize((mvMatrixTranspose * vec4(lightDir, 0.0)).xyz);
  float diffuse = dot(lightDirInCube, surfaceNormal);

  vec3 refRayDirection = vRayDirection + 2.0 * dot(surfaceNormal, -vRayDirection) * surfaceNormal;
  float specular = pow(max(dot(refRayDirection, lightDirInCube), 0.0), 5.0);

  outFlagColor = min(0.2 + diffuse, 1.0) * globalColor + specular * vec4(1.0);
  gl_FragDepth = mix(1.0, vPosition.z / vPosition.w, hitFlag);
  outFlagColor.a = mix(0.0, 1.0, hitFlag);
}

`
