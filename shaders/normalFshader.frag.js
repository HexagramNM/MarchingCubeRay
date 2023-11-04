
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

vec4 createCurrentFuncValueMinusZ(vec3 cubeBase) {
  vec4 result;
  float cubeNumInv = 1.0 / cubeNum;
  result.x = texture(functionValueTexUnit, cubeBase + vec3(0.0, 0.0, 0.0) * cubeNumInv).r;
  result.y = texture(functionValueTexUnit, cubeBase + vec3(1.0, 0.0, 0.0) * cubeNumInv).r;
  result.z = texture(functionValueTexUnit, cubeBase + vec3(0.0, 1.0, 0.0) * cubeNumInv).r;
  result.w = texture(functionValueTexUnit, cubeBase + vec3(1.0, 1.0, 0.0) * cubeNumInv).r;
  return result;
}

vec4 createCurrentFuncValuePlusZ(vec3 cubeBase) {
  vec4 result;
  float cubeNumInv = 1.0 / cubeNum;
  result.x = texture(functionValueTexUnit, cubeBase + vec3(0.0, 0.0, 1.0) * cubeNumInv).r;
  result.y = texture(functionValueTexUnit, cubeBase + vec3(1.0, 0.0, 1.0) * cubeNumInv).r;
  result.z = texture(functionValueTexUnit, cubeBase + vec3(0.0, 1.0, 1.0) * cubeNumInv).r;
  result.w = texture(functionValueTexUnit, cubeBase + vec3(1.0, 1.0, 1.0) * cubeNumInv).r;
  return result;
}

vec4 createExtXFuncValueMinusZ(vec3 cubeBase) {
  vec4 result;
  float cubeNumInv = 1.0 / cubeNum;
  result.x = texture(functionValueTexUnit, cubeBase + vec3(-1.0, 0.0, 0.0) * cubeNumInv).r;
  result.y = texture(functionValueTexUnit, cubeBase + vec3(2.0, 0.0, 0.0) * cubeNumInv).r;
  result.z = texture(functionValueTexUnit, cubeBase + vec3(-1.0, 1.0, 0.0) * cubeNumInv).r;
  result.w = texture(functionValueTexUnit, cubeBase + vec3(2.0, 1.0, 0.0) * cubeNumInv).r;
  return result;
}

vec4 createExtXFuncValuePlusZ(vec3 cubeBase) {
  vec4 result;
  float cubeNumInv = 1.0 / cubeNum;
  result.x = texture(functionValueTexUnit, cubeBase + vec3(-1.0, 0.0, 1.0) * cubeNumInv).r;
  result.y = texture(functionValueTexUnit, cubeBase + vec3(2.0, 0.0, 1.0) * cubeNumInv).r;
  result.z = texture(functionValueTexUnit, cubeBase + vec3(-1.0, 1.0, 1.0) * cubeNumInv).r;
  result.w = texture(functionValueTexUnit, cubeBase + vec3(2.0, 1.0, 1.0) * cubeNumInv).r;
  return result;
}

vec4 createExtYFuncValueMinusZ(vec3 cubeBase) {
  vec4 result;
  float cubeNumInv = 1.0 / cubeNum;
  result.x = texture(functionValueTexUnit, cubeBase + vec3(0.0, -1.0, 0.0) * cubeNumInv).r;
  result.y = texture(functionValueTexUnit, cubeBase + vec3(1.0, -1.0, 0.0) * cubeNumInv).r;
  result.z = texture(functionValueTexUnit, cubeBase + vec3(0.0, 2.0, 0.0) * cubeNumInv).r;
  result.w = texture(functionValueTexUnit, cubeBase + vec3(1.0, 2.0, 0.0) * cubeNumInv).r;
  return result;
}

vec4 createExtYFuncValuePlusZ(vec3 cubeBase) {
  vec4 result;
  float cubeNumInv = 1.0 / cubeNum;
  result.x = texture(functionValueTexUnit, cubeBase + vec3(0.0, -1.0, 1.0) * cubeNumInv).r;
  result.y = texture(functionValueTexUnit, cubeBase + vec3(1.0, -1.0, 1.0) * cubeNumInv).r;
  result.z = texture(functionValueTexUnit, cubeBase + vec3(0.0, 2.0, 1.0) * cubeNumInv).r;
  result.w = texture(functionValueTexUnit, cubeBase + vec3(1.0, 2.0, 1.0) * cubeNumInv).r;
  return result;
}

vec4 createExtZFuncValueMinusZ(vec3 cubeBase) {
  vec4 result;
  float cubeNumInv = 1.0 / cubeNum;
  result.x = texture(functionValueTexUnit, cubeBase + vec3(0.0, 0.0, -1.0) * cubeNumInv).r;
  result.y = texture(functionValueTexUnit, cubeBase + vec3(1.0, 0.0, -1.0) * cubeNumInv).r;
  result.z = texture(functionValueTexUnit, cubeBase + vec3(0.0, 1.0, -1.0) * cubeNumInv).r;
  result.w = texture(functionValueTexUnit, cubeBase + vec3(1.0, 1.0, -1.0) * cubeNumInv).r;
  return result;
}

vec4 createExtZFuncValuePlusZ(vec3 cubeBase) {
  vec4 result;
  float cubeNumInv = 1.0 / cubeNum;
  result.x = texture(functionValueTexUnit, cubeBase + vec3(0.0, 0.0, 2.0) * cubeNumInv).r;
  result.y = texture(functionValueTexUnit, cubeBase + vec3(1.0, 0.0, 2.0) * cubeNumInv).r;
  result.z = texture(functionValueTexUnit, cubeBase + vec3(0.0, 1.0, 2.0) * cubeNumInv).r;
  result.w = texture(functionValueTexUnit, cubeBase + vec3(1.0, 1.0, 2.0) * cubeNumInv).r;
  return result;
}

float functionValue(vec3 pos, vec4 currentFuncValueMinusZ, vec4 currentFuncValuePlusZ) {
  float oneMinusX = 1.0 - pos.x;
  float oneMinusY = 1.0 - pos.y;
  float oneMinusZ = 1.0 - pos.z;
  return oneMinusY * oneMinusZ * (oneMinusX * currentFuncValueMinusZ.x + pos.x * currentFuncValueMinusZ.y)
    + pos.y * oneMinusZ * (oneMinusX * currentFuncValueMinusZ.z + pos.x * currentFuncValueMinusZ.w)
    + oneMinusY * pos.z * (oneMinusX * currentFuncValuePlusZ.x + pos.x * currentFuncValuePlusZ.y)
    + pos.y * pos.z * (oneMinusX * currentFuncValuePlusZ.z + pos.x * currentFuncValuePlusZ.w);
}

vec3 functionNormal(vec3 pos, vec4 currentFuncValueMinusZ, vec4 currentFuncValuePlusZ) {
  float oneMinusX = 1.0 - pos.x;
  float oneMinusY = 1.0 - pos.y;
  float oneMinusZ = 1.0 - pos.z;
  vec3 resultNormal;

  resultNormal.x = oneMinusY * oneMinusZ * (currentFuncValueMinusZ.y - currentFuncValueMinusZ.x)
    + pos.y * oneMinusZ * (currentFuncValueMinusZ.w - currentFuncValueMinusZ.z)
    + oneMinusY * pos.z * (currentFuncValuePlusZ.y - currentFuncValuePlusZ.x)
    + pos.y * pos.z * (currentFuncValuePlusZ.w - currentFuncValuePlusZ.z);

  resultNormal.y = oneMinusX * oneMinusZ * (currentFuncValueMinusZ.z - currentFuncValueMinusZ.x)
    + pos.x * oneMinusZ * (currentFuncValueMinusZ.w - currentFuncValueMinusZ.y)
    + oneMinusX * pos.z * (currentFuncValuePlusZ.z - currentFuncValuePlusZ.x)
    + pos.x * pos.z * (currentFuncValuePlusZ.w - currentFuncValuePlusZ.y);

  resultNormal.z = oneMinusX * oneMinusY * (currentFuncValuePlusZ.x - currentFuncValueMinusZ.x)
    + pos.x * oneMinusY * (currentFuncValuePlusZ.y - currentFuncValueMinusZ.y)
    + oneMinusX * pos.y * (currentFuncValuePlusZ.z - currentFuncValueMinusZ.z)
    + pos.x * pos.y * (currentFuncValuePlusZ.w - currentFuncValueMinusZ.w);

  return normalize(resultNormal);
}

void main(void) {
  const float infinity = 100000.0;
  const float epsilon = 0.00001;
  const int divideNum = 8;

  vec4 currentFuncValueMinusZ = createCurrentFuncValueMinusZ(vCubeBase);
  vec4 currentFuncValuePlusZ = createCurrentFuncValuePlusZ(vCubeBase);

  vec4 extXFuncValueMinusZ = createExtXFuncValueMinusZ(vCubeBase);
  vec4 extXFuncValuePlusZ = createExtXFuncValuePlusZ(vCubeBase);
  vec4 extYFuncValueMinusZ = createExtYFuncValueMinusZ(vCubeBase);
  vec4 extYFuncValuePlusZ = createExtYFuncValuePlusZ(vCubeBase);
  vec4 extZFuncValueMinusZ = createExtZFuncValueMinusZ(vCubeBase);
  vec4 extZFuncValuePlusZ = createExtZFuncValuePlusZ(vCubeBase);

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
    float currentValue = functionValue(currentRayPos, currentFuncValueMinusZ, currentFuncValuePlusZ) - isosurfaceValue;
    hitPos = mix(currentRayPos, hitPos, hitFlag);
    hitFlag = max(hitFlag, 1.0 - step(0.0, currentValue));
    currentRayPos += oneStepT * vRayDirection;
  }

  vec3 surfaceNormal = functionNormal(currentRayPos, currentFuncValueMinusZ, currentFuncValuePlusZ);

  vec3 lightDirInCube = normalize((mvMatrixTranspose * vec4(lightDir, 0.0)).xyz);
  float diffuse = dot(lightDirInCube, surfaceNormal);

  vec3 refRayDirection = vRayDirection + 2.0 * dot(surfaceNormal, -vRayDirection) * surfaceNormal;
  float specular = pow(max(dot(refRayDirection, lightDir), 0.0), 3.0);

  //outFlagColor = min(0.2 + diffuse, 1.0) * globalColor + specular * vec4(1.0);
  outFlagColor.xyz = surfaceNormal;
  gl_FragDepth = mix(1.0, vPosition.z / vPosition.w, hitFlag);
  outFlagColor.a = mix(0.0, 1.0, hitFlag);
}

`
