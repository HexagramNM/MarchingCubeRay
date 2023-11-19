
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
  vec3 oneMinusPos = vec3(1.0) - pos;
  return oneMinusPos.y * oneMinusPos.z * (oneMinusPos.x * currentFuncValueMinusZ.x + pos.x * currentFuncValueMinusZ.y)
    + pos.y * oneMinusPos.z * (oneMinusPos.x * currentFuncValueMinusZ.z + pos.x * currentFuncValueMinusZ.w)
    + oneMinusPos.y * pos.z * (oneMinusPos.x * currentFuncValuePlusZ.x + pos.x * currentFuncValuePlusZ.y)
    + pos.y * pos.z * (oneMinusPos.x * currentFuncValuePlusZ.z + pos.x * currentFuncValuePlusZ.w);
}

void main(void) {
  const float infinity = 10000.0;
  const float epsilon = 0.0001;
  const int divideNum = 8;
  const int iterNum = 24;

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

  vec3 rayOrigin = clamp(vRayOrigin, 0.0, 1.0);
  vec3 rayDirection = normalize(vRayDirection);
  float maxT = infinity;
  for (int idx = 0; idx < 3; idx++) {
    float signDir = step(0.0, rayDirection[idx]);
    float candidateT = mix(rayOrigin[idx], 1.0 - rayOrigin[idx], signDir) / (abs(rayDirection[idx]) + epsilon);
    maxT = min(maxT, mix(infinity, candidateT, step(epsilon, abs(rayDirection[idx]))));
  }
  maxT = mix(0.0, maxT, step(epsilon, abs(infinity - maxT)));
  maxT = max(maxT, 0.0);

  vec3 currentRayPos = rayOrigin;
  float invDivideNum = 1.0 / float(divideNum);
  float oneStepT = maxT * invDivideNum;
  float currentT = 0.0;

  float hitFlag = 0.0;
  for (int idx = 0; idx < iterNum; idx++) {
    float currentValue = trilinearInterpolation(currentRayPos, funcValueMinusZ, funcValuePlusZ) - isosurfaceValue;
    float currentSign = step(0.0, currentValue);
    hitFlag = max(hitFlag, 1.0 - currentSign);
    currentT -= mix(oneStepT, 0.0, currentSign);
    oneStepT *= mix(invDivideNum, 1.0, currentSign);
    currentT = clamp(currentT + oneStepT, 0.0, maxT);
    currentRayPos = clamp(rayOrigin + currentT * rayDirection, 0.0, 1.0);
  }

  vec3 surfaceNormal;
  surfaceNormal.x = trilinearInterpolation(currentRayPos, funcNormalXMinusZ, funcNormalXPlusZ);
  surfaceNormal.y = trilinearInterpolation(currentRayPos, funcNormalYMinusZ, funcNormalYPlusZ);
  surfaceNormal.z = trilinearInterpolation(currentRayPos, funcNormalZMinusZ, funcNormalZPlusZ);
  surfaceNormal = normalize(surfaceNormal);

  vec3 lightDirInCube = normalize((mvMatrixTranspose * vec4(lightDir, 0.0)).xyz);
  float diffuse = max(dot(lightDirInCube, surfaceNormal), 0.0);

  vec3 refRayDirection = rayDirection + 2.0 * dot(surfaceNormal, - rayDirection) * surfaceNormal;
  float specular = pow(max(dot(refRayDirection, lightDirInCube), 0.0), 5.0);

  outFlagColor = min(0.2 + diffuse, 1.0) * globalColor + specular * vec4(1.0);
  gl_FragDepth = mix(1.0, vPosition.z / vPosition.w, hitFlag);
  outFlagColor.a = mix(0.0, 1.0, hitFlag);
}

`
