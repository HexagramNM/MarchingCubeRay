
import {matIV} from "./minMatrix.js";
import {create_vbo,
	create_ibo,
	create_shader,
	create_program} from "./createWebGLObj.js";
import {eShape,
	nShape,
	isosurfaceValue,
	globalColor,
	lightDir,
	zoom,
	updateParameter} from "./controller.js";

import mcrVshaderSrc from "./../shaders/mcrVshader.vert.js";
import mcrFshaderSrc from "./../shaders/mcrFshader.frag.js";

var timeInfo = {
	count: 0,
	fps: 60.0,
	previousTimeStep: null,
	performaceStartTime: null,
	frameCount: 0
};
var canvasInfo = {
	width: 1280,
	height: 720,
	shouldUpdateViewport: true
};
var settingInfo = {
	eShape: 0.3,
	nShape: 0.3,
	zoom: 0.5
};
var cubeInfo = {
	size: 0.2,
	num: 64
};
var bufferInfo = {
	position_vbo: null,
	position_data: null,
	cubePos_vbo: null,
	cubePos_data: null,
	cubeBase_vbo: null,
	cubeBase_data: null,
	ibo: null,
	index_num: 0
};
var textureInfo = {
	functionValue_tex: null,
	functionValue_data: null
}
var normalShaderInfo = {
	program: null,
	attLocation: new Array(),
	attStride: new Array(),
	uniLocation: new Array()
};

var m = new matIV();
var mMatrix = m.identity(m.create());
var vMatrix = m.identity(m.create());
var pMatrix = m.identity(m.create());
var vpMatrix = m.identity(m.create());
var mvMatrix = m.identity(m.create());
var mvMatrixTranspose = m.identity(m.create());
var mvpMatrix = m.identity(m.create());

var cubeBasePosition = [
	0.0, 0.0, 0.0,
	1.0, 0.0, 0.0,
	0.0, 1.0, 0.0,
	1.0, 1.0, 0.0,
	0.0, 0.0, 1.0,
	1.0, 0.0, 1.0,
	0.0, 1.0, 1.0,
	1.0, 1.0, 1.0,
];

var cubeBaseIndex = [
	1, 3, 7,
	1, 7, 5,
	2, 0, 6,
	6, 0, 4,
	2, 7, 3,
	2, 6, 7,
	0, 1, 5,
	0, 5, 4,
	0, 2, 1,
	1, 2, 3,
	4, 5, 6,
	5, 7, 6
];

function functionValue(x, y, z) {
	var superElipsoid = Math.pow(Math.pow(Math.abs(x), 2.0 / eShape) + Math.pow(Math.abs(y), 2.0 / eShape), eShape / nShape)
		+ Math.pow(Math.abs(z), 2.0 / nShape);
	return superElipsoid;
}

function createCubeBuffer() {
	const maxCubeNumInOneVbo = 64 * 64;
	const vboNum = Math.round(Math.pow(cubeInfo.num, 3)) / maxCubeNumInOneVbo;
	bufferInfo.index_num = maxCubeNumInOneVbo * cubeBaseIndex.length;
	bufferInfo.position_data = new Array(vboNum);
	bufferInfo.cubePos_data = new Array(vboNum);
	bufferInfo.cubeBase_data = new Array(vboNum);

	const vboDataNum = maxCubeNumInOneVbo * cubeBasePosition.length;
	for (var vboIdx = 0; vboIdx < vboNum; vboIdx++) {
		bufferInfo.position_data[vboIdx] = new Float32Array(vboDataNum);
		bufferInfo.cubePos_data[vboIdx] = new Float32Array(vboDataNum);
		bufferInfo.cubeBase_data[vboIdx] = new Float32Array(vboDataNum);
	}

	var cubeIdx = 0;
	var vboIdx = 0;
	const cubeVertexNum = cubeBasePosition.length / 3;
	const entireSize = cubeInfo.num * cubeInfo.size;
	for (var z = 0; z < cubeInfo.num; z++) {
		for (var y = 0; y < cubeInfo.num; y++) {
			for (var x = 0; x < cubeInfo.num; x++) {
				var basePos = [
					x * cubeInfo.size - entireSize * 0.5,
					y * cubeInfo.size - entireSize * 0.5,
					z * cubeInfo.size - entireSize * 0.5
				];
				var xyz = [x, y, z];

				for (var cIdx = 0; cIdx < cubeVertexNum; cIdx++) {
					var currentMemHead = cubeIdx * cubeBasePosition.length + cIdx * 3;
					for (var xyzIdx = 0; xyzIdx < xyz.length; xyzIdx++) {
						// position
						bufferInfo.position_data[vboIdx][currentMemHead + xyzIdx]
							= basePos[xyzIdx] + cubeBasePosition[cIdx * 3 + xyzIdx] * cubeInfo.size;

						// cubePos
						bufferInfo.cubePos_data[vboIdx][currentMemHead + xyzIdx]
							= cubeBasePosition[cIdx * 3 + xyzIdx];

						// cubeBase
						bufferInfo.cubeBase_data[vboIdx][currentMemHead + xyzIdx]
							= xyz[xyzIdx] / cubeInfo.num;
					}
				}
				cubeIdx++;
				if (cubeIdx >= maxCubeNumInOneVbo) {
					cubeIdx = 0;
					vboIdx++;
				}
			}
		}
	}
	bufferInfo.position_vbo = create_vbo(bufferInfo.position_data[0], true);
	bufferInfo.cubePos_vbo = create_vbo(bufferInfo.cubePos_data[0], true);
	bufferInfo.cubeBase_vbo = create_vbo(bufferInfo.cubeBase_data[0], true);

	// ibo
	var index = new Uint16Array(bufferInfo.index_num);
	for (cubeIdx = 0; cubeIdx < maxCubeNumInOneVbo; cubeIdx++) {
			for (var idx = 0; idx < cubeBaseIndex.length; idx++) {
				index[cubeIdx * cubeBaseIndex.length + idx]
					= 8 * cubeIdx + cubeBaseIndex[idx];
			}
	}
	bufferInfo.ibo = create_ibo(index);
}

function setCubeBufferPointer() {
	g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.position_vbo);
	g_gl.enableVertexAttribArray(normalShaderInfo.attLocation[0]);
	g_gl.vertexAttribPointer(normalShaderInfo.attLocation[0], normalShaderInfo.attStride[0], g_gl.FLOAT, false, 0, 0);
	g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.cubePos_vbo);
	g_gl.enableVertexAttribArray(normalShaderInfo.attLocation[1]);
	g_gl.vertexAttribPointer(normalShaderInfo.attLocation[1], normalShaderInfo.attStride[1], g_gl.FLOAT, false, 0, 0);
	g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.cubeBase_vbo);
	g_gl.enableVertexAttribArray(normalShaderInfo.attLocation[2]);
	g_gl.vertexAttribPointer(normalShaderInfo.attLocation[2], normalShaderInfo.attStride[2], g_gl.FLOAT, false, 0, 0);
}

function createFunctionValueTexture() {
	textureInfo.functionValue_tex = g_gl.createTexture();
	g_gl.activeTexture(g_gl.TEXTURE0);
	g_gl.bindTexture(g_gl.TEXTURE_3D, textureInfo.functionValue_tex);
	g_gl.texStorage3D(g_gl.TEXTURE_3D, 1, g_gl.RGBA32F,
		cubeInfo.num + 1, cubeInfo.num + 1, cubeInfo.num + 1);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_MAG_FILTER, g_gl.NEAREST);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_MIN_FILTER, g_gl.NEAREST);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_WRAP_S, g_gl.CLAMP_TO_EDGE);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_WRAP_T, g_gl.CLAMP_TO_EDGE);
	g_gl.texParameteri(g_gl.TEXTURE_3D, g_gl.TEXTURE_WRAP_R, g_gl.CLAMP_TO_EDGE);
}

function updateFunctionValueTexture() {
	const entireSize = cubeInfo.num * cubeInfo.size;
	const epsilon = 0.001;

	textureInfo.functionValue_data = new Float32Array(Math.round(Math.pow(cubeInfo.num + 1, 3)) * 4);
	var vertIdx = 0;
	for (var z = 0; z <= cubeInfo.num; z++) {
		for (var y = 0; y <= cubeInfo.num; y++) {
			for (var x = 0; x <= cubeInfo.num; x++) {
				var basePos = [
					x * cubeInfo.size - entireSize * 0.5,
					y * cubeInfo.size - entireSize * 0.5,
					z * cubeInfo.size - entireSize * 0.5
				];

				var currentFuncValue = functionValue(basePos[0], basePos[1], basePos[2]);
				textureInfo.functionValue_data[4 * vertIdx] = (functionValue(basePos[0] + epsilon, basePos[1], basePos[2])
					- currentFuncValue) / epsilon;
				textureInfo.functionValue_data[4 * vertIdx + 1] = (functionValue(basePos[0], basePos[1] + epsilon, basePos[2])
					- currentFuncValue) / epsilon;
				textureInfo.functionValue_data[4 * vertIdx + 2] = (functionValue(basePos[0], basePos[1], basePos[2] + epsilon)
					- currentFuncValue) / epsilon;
				textureInfo.functionValue_data[4 * vertIdx + 3] = currentFuncValue;
				vertIdx++;
			}
		}
	}

	g_gl.texSubImage3D(g_gl.TEXTURE_3D, 0, 0, 0, 0, cubeInfo.num + 1, cubeInfo.num + 1,
		cubeInfo.num + 1, g_gl.RGBA, g_gl.FLOAT, textureInfo.functionValue_data);
}

function adjustCanvasSize() {
	var c = document.getElementById('MarchingCubeRay_Output');
	var currentWidth = document.documentElement.clientWidth * 0.8;
	var currentHeight = document.documentElement.clientHeight;
	var widthMargin = 0;
	var heightMargin = 0;

	if (currentWidth * canvasInfo.height / canvasInfo.width > currentHeight) {
		currentWidth = currentHeight * canvasInfo.width / canvasInfo.height;
		widthMargin = (document.documentElement.clientWidth - currentWidth) * 0.5;
	}
	else {
		currentHeight = currentWidth * canvasInfo.height / canvasInfo.width;
		heightMargin = (document.documentElement.clientHeight - currentHeight) * 0.5;
	}

	if (c.width != currentWidth || c.height != currentHeight) {
		c.width = currentWidth;
		c.height = currentHeight;
		canvasInfo.shouldUpdateViewport = true;
	}
	c.style.margin = heightMargin.toString() + "px " + widthMargin.toString() + "px";
}

function updateViewport() {
	if (canvasInfo.shouldUpdateViewport) {
		var c = document.getElementById('MarchingCubeRay_Output');
		g_gl.viewport(0, 0, c.width, c.height);
		g_gl.blendFunc(g_gl.SRC_ALPHA, g_gl.ONE_MINUS_SRC_ALPHA);
		m.perspective(60.0, c.width/c.height, 1.0, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, vpMatrix);
		canvasInfo.shouldUpdateViewport = false;
	}
}

function updateCameraView() {
	var c = document.getElementById('MarchingCubeRay_Output');
	var zoomIn = [0.0, 3.5, -9];
	var zoomOut = [0.0, 10.5, -27];
	var currentZoom = [0.0, 0.0, 0.0];

	for (var idx = 0; idx < 3; idx++) {
		currentZoom[idx] = (1.0 - zoom) * zoomOut[idx] + zoom * zoomIn[idx];
	}

	m.lookAt(currentZoom, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);
	m.multiply(pMatrix, vMatrix, vpMatrix);
}

function setupShaderProgram(shaderInfo) {
	shaderInfo.attLocation[0]=g_gl.getAttribLocation(shaderInfo.program, 'position');
	shaderInfo.attStride[0]=3;
	shaderInfo.attLocation[1]=g_gl.getAttribLocation(shaderInfo.program, 'cubePos');
	shaderInfo.attStride[1]=3;
	shaderInfo.attLocation[2]=g_gl.getAttribLocation(shaderInfo.program, 'cubeBase');
	shaderInfo.attStride[2]=3;
	shaderInfo.uniLocation[0] = g_gl.getUniformLocation(shaderInfo.program, 'mvpMatrix');
	shaderInfo.uniLocation[1] = g_gl.getUniformLocation(shaderInfo.program, 'mvMatrix');
	shaderInfo.uniLocation[2] = g_gl.getUniformLocation(shaderInfo.program, 'mvMatrixTranspose');
	shaderInfo.uniLocation[3] = g_gl.getUniformLocation(shaderInfo.program, 'cubeNum');
	shaderInfo.uniLocation[4] = g_gl.getUniformLocation(shaderInfo.program, 'functionValueTexUnit');
	shaderInfo.uniLocation[5] = g_gl.getUniformLocation(shaderInfo.program, 'isosurfaceValue');
	shaderInfo.uniLocation[6] = g_gl.getUniformLocation(shaderInfo.program, 'globalColor');
	shaderInfo.uniLocation[7] = g_gl.getUniformLocation(shaderInfo.program, 'lightDir');
}

function displayNotSupportedBrowser() {
	var c = document.getElementById('MarchingCubeRay_Output');
	var ctx = c.getContext('2d');
	ctx.clearRect(0, 0, c.width, c.height);
	ctx.font = "20px serif";
	ctx.fillStyle = "#ffffff";
	ctx.fillText("申し訳ございません。お使いのブラウザには対応しておりません。", 20, 20);
}

export function MarchingCubeRay_init() {
	var c = document.getElementById('MarchingCubeRay_Output');
	if (!c || !(c.getContext)) {
		return;
	}
	g_gl=c.getContext('webgl2');
	if (!g_gl || !g_gl.getExtension("EXT_color_buffer_float")){
		requestAnimationFrame(MarchingCubeRay_errorMain);
		return;
	}

	adjustCanvasSize();
	updateViewport();

	var v_shader=create_shader(mcrVshaderSrc, "x-shader/x-vertex");
	var f_shader=create_shader(mcrFshaderSrc, "x-shader/x-fragment");

	//normalShaderのプログラム設定
	normalShaderInfo.program = create_program(v_shader, f_shader);
	setupShaderProgram(normalShaderInfo);

	g_gl.enable(g_gl.BLEND);
	g_gl.blendFunc(g_gl.SRC_ALPHA, g_gl.ONE_MINUS_SRC_ALPHA);
	g_gl.enable(g_gl.CULL_FACE);
	g_gl.enable(g_gl.DEPTH_TEST);
	g_gl.depthFunc(g_gl.LEQUAL);

	settingInfo.eShape = eShape;
	settingInfo.nShape = nShape;
	settingInfo.zoom = zoom;

	updateCameraView();

	createCubeBuffer();
	setCubeBufferPointer();
	createFunctionValueTexture();
	updateFunctionValueTexture();

	timeInfo.previousTimestamp =  performance.now();
	requestAnimationFrame(MarchingCubeRay_main);
}

function draw() {
	g_gl.clearColor(0.0, 0.0, 0.0, 0.0);
	g_gl.clearDepth(1.0);
	g_gl.clear(g_gl.COLOR_BUFFER_BIT | g_gl.DEPTH_BUFFER_BIT);
	g_gl.useProgram(normalShaderInfo.program);

	var rad=(timeInfo.count - Math.floor(timeInfo.count / 720.0) * 720.0) * Math.PI/360;
	var x = Math.cos(rad);
	var y = Math.sin(rad);
	m.identity(mMatrix);
	m.rotate(mMatrix, rad, [0.0, 1.0, 0.0], mMatrix);
	m.multiply(vpMatrix, mMatrix, mvpMatrix);
	m.multiply(vMatrix, mMatrix, mvMatrix);
	m.transpose(mvMatrix, mvMatrixTranspose);

	g_gl.uniformMatrix4fv(normalShaderInfo.uniLocation[0], false, mvpMatrix);
	g_gl.uniformMatrix4fv(normalShaderInfo.uniLocation[1], false, mvMatrix);
	g_gl.uniformMatrix4fv(normalShaderInfo.uniLocation[2], false, mvMatrixTranspose);
	g_gl.uniform1f(normalShaderInfo.uniLocation[3], cubeInfo.num);
	g_gl.uniform1i(normalShaderInfo.uniLocation[4], 0);
	g_gl.uniform1f(normalShaderInfo.uniLocation[5], isosurfaceValue);
	g_gl.uniform4fv(normalShaderInfo.uniLocation[6], globalColor);
	g_gl.uniform3fv(normalShaderInfo.uniLocation[7], lightDir);

	g_gl.bindBuffer(g_gl.ELEMENT_ARRAY_BUFFER, bufferInfo.ibo);
	for (var vboIdx = 0; vboIdx < bufferInfo.position_data.length; vboIdx++) {
		g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.position_vbo);
		g_gl.bufferSubData(g_gl.ARRAY_BUFFER, 0, bufferInfo.position_data[vboIdx]);
		g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.cubePos_vbo);
		g_gl.bufferSubData(g_gl.ARRAY_BUFFER, 0, bufferInfo.cubePos_data[vboIdx]);
		g_gl.bindBuffer(g_gl.ARRAY_BUFFER, bufferInfo.cubeBase_vbo);
		g_gl.bufferSubData(g_gl.ARRAY_BUFFER, 0, bufferInfo.cubeBase_data[vboIdx]);
		g_gl.drawElements(g_gl.TRIANGLES, bufferInfo.index_num, g_gl.UNSIGNED_SHORT, 0);
	}

	g_gl.flush();
}

function MarchingCubeRay_main() {
	if (timeInfo.frameCount == 0) {
		timeInfo.performanceStartTime = performance.now();
	}
	if (zoom != settingInfo.zoom) {
		settingInfo.zoom = zoom;
		updateCameraView();
	}
	if (eShape != settingInfo.eShape
		|| nShape != settingInfo.nShape) {

		settingInfo.eShape = eShape;
		settingInfo.nShape = nShape;
		updateFunctionValueTexture();
	}
	adjustCanvasSize();
	updateViewport();
	updateParameter();
	draw();
	var endTime = performance.now();
	timeInfo.count += (endTime - timeInfo.previousTimestamp) * timeInfo.fps * 0.001;
	timeInfo.previousTimestamp = endTime;
	timeInfo.frameCount++;
	if (timeInfo.frameCount >= 60) {
		var resultFps = timeInfo.frameCount / ((endTime - timeInfo.performanceStartTime) * 0.001);
		document.getElementById("fpsText").innerHTML = Math.round(resultFps * 10.0) / 10.0;
		timeInfo.frameCount = 0;
	}
	requestAnimationFrame(MarchingCubeRay_main);
}

function MarchingCubeRay_errorMain() {
	adjustCanvasSize();
	displayNotSupportedBrowser();
	requestAnimationFrame(MarchingCubeRay_errorMain);
}
